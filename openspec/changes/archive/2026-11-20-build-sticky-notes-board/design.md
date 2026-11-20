# Design

## Context

Greenfield: the repo holds only the stock Vite 8 + React 19 + TypeScript template (no application code, no state library, no tests, no strict mode). The assessment (see proposal.md → Why) asks us to be judged on architecture/design, performance, typing accuracy, code quality and usability, and explicitly forbids readymade UI components. Time budget is 3–4 hours, hard communication point at 6. Desktop-only, latest Chrome/Firefox/Edge, min 1024×768.

Two standing project constraints shape this design: (1) bun is the required JS/TS toolchain in this environment — the brief listed pnpm, but the scaffold already ships `bun.lock`, so we keep bun and document the deviation (see proposal.md); (2) new dependencies must be justified — see each entry in Decisions 5 and 6.

## Goals / Non-Goals

**Goals:**

- One gesture per feature, all pointer-based: draw-to-create, drag-to-move, corner-drag-to-resize, drag-to-trash-to-delete.
- A hand-rolled, testable state model (pure reducer) as the single source of truth; the React layer is a projection of it.
- Pointer Events + `setPointerCapture` as the only input strategy (no mouse/touch fallback code paths).
- Graceful persistence: localStorage authoritative + async REST mock, never crashing on corrupt state.
- Proportionate tests around the reducer, geometry, persistence validation, and the four drag interactions.

**Non-Goals:**

- No backend, no auth, no collaboration, no mobile/touch gestures beyond what Pointer Events give us for free.
- No undo/redo; no keyboard-driven note movement; no note ordering UI beyond implicit z-order.
- No visual "rubber-band multi-select". Notes are manipulated individually.

## Decisions

### 1. Interaction model: pointer events with capture, one drag engine

All gestures (create, move, resize, delete) are variants of the same primitive: `pointerdown` → `setPointerCapture(pointerId)` → `pointermove` handlers → `pointerup`/`lostpointercapture`/`Escape` to finish or cancel. One `useDrag` hook owns this. Alternatives considered: mouse events (worse, two codebases); HTML5 Drag & Drop API (rejected — it is document-focused, shows a ghost preview, fires no per-frame callbacks for intermediate feedback, and cannot express resize). Escape cancels by re-applying the geometry captured at `pointerdown`, which makes cancellation trivially exact.

### 2. Geometry in board coordinates, notes stored as plain data

All positions/sizes live in board-space CSS pixels. Board rect is read once per gesture via `getBoundingClientRect()` (cached per gesture, not per frame), and every pointer coordinate is converted with `clientX − rect.left`, `clientY − rect.top`. Clamping (min size 120×60, default 240×160, board containment) lives in pure functions under `src/domain/` so the reducer and tests share it. CSS uses `left/top` + fixed pixel sizes — simple, and the re-render count is tiny because only the dragged note re-renders (React Compiler + `memo`).

Performance note: re-rendering on every `pointermove` is acceptable here (tens of notes, trivial DOM per note). If profiling ever showed jank, the fallback is to mutate a CSS transform during the drag and commit once on `pointerup`; the state model already keeps geometry as data so that swap is localized to the Note component.

### 3. State: `useReducer` store with context, no library

`BoardState = { notes: Record<NoteId, Note>, zCounter: number }`. Actions: `createNote`, `updateGeometry` (position/size), `setText`, `setColor`, `bringToFront`, `deleteNote`, plus internal `beginDragGeometry` snapshots used to guarantee exact cancellation. A `NotesProvider` exposes `{ state, dispatch }` through context. Alternatives considered: zustand/Redux (rejected — the assessment rewards hand-rolled solutions and adds a dependency we don't need); uncontrolled local state + refs (rejected — breaks testability and persistence symmetry).

### 4. Persistence: two adapters behind one effect

- `localStorage` (authoritative): saved debounced (200 ms via microtask batching on dispatch), schema-versioned (`{ version: 1, notes: [...] }`), restored on mount. A hand-written validator (`infra/persistence.ts`) checks shape/types defensively; anything invalid → empty board + `console.warn`. Write failures are swallowed to a warning (storage can be disabled or full).
- Async REST mock (feature V): `NotesApi` interface with `load()`/`saveAll(notes)`; `MockRestNotesApi` simulates 250–600 ms latency with `setTimeout`, keeps an in-memory snapshot, and can be told to fail. A "sync" status reducer (`idle | syncing | synced | error`) drives the toolbar indicator. The mock is injected, so swapping in a real API is a one-line change at the composition root. This keeps the assessment's async requirement honest (real delay, Promise-based) without a server.

### 5. Testing stack (dev-only, justified)

- `vitest` — Vite-native runner, zero extra transpile config; used for all unit + component tests.
- `jsdom` — DOM environment for component tests.
- `@testing-library/react` (+ `@testing-library/dom`) — queries/events against real DOM semantics, matching the UX assertions in the specs.
All three are devDependencies only; no runtime dependency is added. `setPointerCapture`/`releasePointerCapture` are stubbed in the test setup because jsdom does not implement them.

### 6. Tooling baseline

TypeScript `strict: true` is added to `tsconfig.app.json` (the template ships without it; the brief requires strict). Vitest runs through bun (`bun test` remains unused in favor of `bunx vitest`/`bun run test` for ecosystem compatibility). ESLint flat config from the template is kept unchanged.

## Risks / Trade-offs

- Re-render per `pointermove` could become hot on huge boards → mitigated by `memo` + single-note updates; fallback documented in Decision 2.
- jsdom cannot truly exercise pointer capture or layout → component tests assert behavior via stubbed capture and synthetic events; real geometry is asserted in pure-function tests; final validation is manual in Chrome.
- localStorage schema can drift with future changes → versioned payload + validator; version 1 only, no migration code (YAGNI for an assessment).
- Mock REST latency could race with rapid edits → sync effect snapshots the notes at dispatch time and serializes saves (one in-flight call at a time).
- 1024×768 target: toolbar + trash zone are fixed-position strips; the board clamps note geometry, so content never escapes the viewport at minimum resolution.

## Open Questions

None at implementation time. Remaining polish items (undo, full keyboard support, note search) are intentionally out — listed in the README as known limitations.
