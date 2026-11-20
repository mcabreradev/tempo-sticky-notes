# Sticky Notes

A single-page desktop app for sticky notes on a cork board: draw a note wherever you want it,
move it, resize it, and throw it away by dragging it onto the trash strip.

Built for a front-end take-home assessment: React + TypeScript + Vite, no UI library, no
ready-made interaction code.

## Implemented features

Mandatory features from the assessment (all four; at least three were required):

| # | Feature | How it works |
|---|---|---|
| 1 | Create a note at a specified position and size | Press on empty board space and drag: a preview rectangle follows the pointer and the note is created with exactly that geometry on release. A plain click creates a default 240×160 note centered on the click, and the toolbar's "+ New note" places a default note at the next free cascading slot. |
| 2 | Change note size by dragging | Bottom-right corner handle. The top-left corner stays anchored; minimum size is 120×60. |
| 3 | Move a note by dragging | Press anywhere on the note (its title bar or body) and drag. Pointer capture keeps the note following the pointer outside the element and outside the window. |
| 4 | Remove a note by dragging it over a "trash" zone | A fixed trash strip across the bottom of the board. It arms when a drag starts, turns red when the dragged note hovers over it, and deletes the note on drop. |

Optional features (all five, in the client's preferred order):

- **I. Text editing** — double-click a note to edit inline; save with blur or Cmd/Ctrl+Enter, discard with Escape.
- **II. Bring to front** — pressing a note raises it above overlapping notes (monotonic z-index).
- **III. localStorage persistence** — the board is saved (debounced) and restored on load; invalid or unavailable storage falls back to an empty board without crashing.
- **IV. Note colors** — six pastel colors, chosen from swatches on the note's title bar.
- **V. REST API mock** — every change is also pushed through an asynchronous mock REST client (simulated 250–600 ms latency). The toolbar shows the sync state: local draft, syncing, synced, or failed.

Keyboard/behavioural details that matter during review: **Escape cancels** an in-flight move or resize and restores the exact previous geometry; a note dragged over the trash and then dragged back out is kept; the board clamps every note to stay fully visible, including after a window resize.

## Requirements

- [Bun](https://bun.sh) ≥ 1.3 (the lockfile is `bun.lock`).
- A current Chromium-based browser or Firefox. Desktop only; designed down to 1024×768.

## Install and run

```bash
bun install
bun run dev        # dev server with HMR, http://localhost:5173
```

Production build and preview:

```bash
bun run build      # type-check (tsc -b) + Vite production build into dist/
bun run preview    # serve dist/
```

Tests and lint:

```bash
bun run test       # Vitest (jsdom): domain, store, persistence, drag engine, UI interactions
bun run lint       # ESLint flat config
```

The npm scripts are plain `vite`/`vitest`/`tsc`/`eslint` commands, so any package manager can run
them; bun is what the lockfile and the author's toolchain use.

## Using the app

- **Create** — drag on empty board space to draw the note; or click for a default note; or press
  "+ New note".
- **Move** — drag the note (grab anywhere except the resize handle, the color swatches, or the text
  editor).
- **Resize** — drag the bottom-right corner handle.
- **Delete** — drag the note down to the trash strip ("Drop here to delete") and release.
- **Edit text** — double-click the note; Cmd/Ctrl+Enter or clicking away saves, Escape reverts.
- **Color** — hover a note and pick one of the six swatches in its title bar.
- **Cancel** — press Escape during any move or resize drag.

## Architecture

The app is layered so that behaviour can be tested without a browser. `src/domain/note.ts` holds the
`Note` model and every geometry rule as pure functions — normalising a drag rectangle, enforcing the
minimum and default sizes, clamping a rectangle inside the board, point-in-rectangle testing and
cascading free-slot search for the toolbar button. `src/app/store.ts` is a plain reducer
(`create`, `updateGeometry`, `setText`, `setColor`, `bringToFront`, `delete`, `hydrate`) over
`{ notes, zCounter }`, where the monotonic counter — not array order — defines stacking, and
`src/app/NotesProvider.tsx` owns the single store instance, hydrates it from `localStorage` in the
lazy `useReducer` initialiser, debounces saves, and serialises async sync calls so rapid edits
coalesce instead of racing. The UI is a projection of that state: a `Board` that renders notes
absolutely positioned in board-space pixels and owns all gesture state, a memoised `Note` that only
handles its own text editing and palette, a `TrashZone` strip, and a `Toolbar` with the sync
indicator. Nothing outside the component tree mutates state.

Gestures are one primitive, not four. `src/hooks/useDrag.ts` starts a pointer session on primary
`pointerdown`, calls `setPointerCapture` on the element, listens for `pointermove` / `pointerup` /
`pointercancel` on `window`, and ends or cancels the session on `Escape`. On `pointerdown` the caller
captures a geometry snapshot in a closure, so cancellation is exact by construction: create, move
and resize are three different session factories over the same engine. Board geometry is measured
once per gesture (never per frame) and every pointer coordinate is converted into board space, which
keeps positions independent of scroll, window offset and the toolbar above the board.

Persistence is deliberately two-tiered. `src/infra/persistence.ts` is the authoritative, synchronous
adapter: a versioned payload (`{ version: 1, notes: [...] }`), a hand-written validator for every
field (positions finite, color from the known palette, integer z-index), and fail-safe reads/writes
that degrade to an empty board plus a console warning. `src/infra/mockApi.ts` is the async REST
seam: a `NotesApi` interface with a `MockRestNotesApi` that resolves with real `setTimeout` latency
and can be told to fail, which drives the toolbar's syncing/synced/error states. Swapping the mock
for a real endpoint means replacing one object at the provider's composition point; the board code
never knows the difference.

## Project structure

```
src/
  domain/note.ts         Note model, palette, pure geometry helpers
  app/store.ts           Board reducer and actions (single source of truth)
  app/notesContext.ts    React context and useNotes hook
  app/NotesProvider.tsx  Store wiring: hydration, debounced persistence, serialised sync
  hooks/useDrag.ts       Pointer-capture drag engine (move, resize, create, cancel)
  components/Board.tsx   Board, create/move/resize sessions, trash hit-testing, resize clamping
  components/Note.tsx    Note rendering, inline text editing, color palette
  components/TrashZone.tsx
  components/Toolbar.tsx
  infra/persistence.ts   localStorage adapter + schema validation
  infra/mockApi.ts       Asynchronous REST mock
openspec/                OpenSpec planning artifacts for the change `build-sticky-notes-board`
```

## Tests and verification

`bun run test` runs 72 tests: geometry and slot-search units, every reducer action (including exact
cancel-restore), persistence validation and failure modes, the async mock (real latency, scripted
failure), the drag hook (delta reporting, out-of-element movement, Escape, pointercancel, sequential
sessions) and full UI interaction tests that drive pointer events through create, move, resize,
trash deletion, stacking, text editing, colors, restore-from-storage and the sync status machine.

What was verified manually in a real browser (Chrome, CDP-driven input, viewport forced to
1024×768): drag-to-create landing at exactly the drawn geometry, click-create centring, minimum-size
clamping, board-edge clamping, move with preserved grab offset, corner resize with anchored
top-left, trash arming/danger feedback and deletion on drop, keeping a note dragged out of the
trash, double-click text editing saved on blur, color change from the palette, reload restoring the
board from localStorage, and the sync indicator moving to "Synced".

Not verified: Firefox and Edge (not available in this environment), touch input, and operating
systems other than macOS.

## Known limitations

- No undo/redo, no multi-select, no keyboard-only note movement (Escape and Cmd/Ctrl+Enter are the
  only in-note shortcuts).
- A single-trash-zone deletion model; notes cannot be restored after a drop.
- The REST mock lives in memory per tab; reloading does not re-read the "server".
- Notes are clamped to the visible board, so very small windows squeeze note sizes rather than
  offering panning/scrolling of a larger canvas.
- Text has no length limit and the note does not scroll overflowing text (overflow is hidden).

## Tooling decisions

- **Bun** instead of the assessment brief's pnpm: the scaffold already shipped `bun.lock` and bun is
  this environment's JS/TS toolchain. The scripts are package-manager agnostic.
- **Vitest + jsdom + Testing Library** (dev dependencies only): the natural runner for Vite, with
  DOM-level assertions for the interaction specs. No runtime dependency was added; React and React
  DOM remain the only production dependencies besides the Vite scaffold.
- **React Compiler** stays enabled from the template (`vite.config.ts`); components are written to be
  memoisation-friendly (memoised `Note`, stable callbacks via `useCallback`).
