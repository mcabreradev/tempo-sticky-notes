# Sticky Notes

A single-page desktop app for sticky notes on a cork board: **draw** a note wherever you want it,
**drag** it around, **resize** it from the corner, **edit** it, **recolor** it, and **throw it away**
by dropping it on the trash strip.

![The board with six notes on a cork background](docs/sticky-notes.png)

Built as a front-end take-home assessment. React + TypeScript + Vite, **no UI library, no
drag-and-drop library** — every gesture is hand-written with Pointer Events so the interaction design
and the engineering behind it are both visible in the source.

```bash
bun install
bun run dev        # http://localhost:5173
```

Drag on the cork board to draw your first note. Everything else is discoverable from there.

## Features

### Required by the assessment — 4 of 4 implemented (three were required)

| # | Feature | How it works |
|---|---|---|
| 1 | Create a note at a specified position and size | Press on empty board space and drag: a preview rectangle follows the pointer and the note is created with exactly that geometry on release. A plain click creates a default 240×160 note centered on the click; the toolbar's "+ New note" places one at the next free cascading slot. |
| 2 | Change note size by dragging | Bottom-right corner handle. The top-left corner stays anchored; minimum size is 120×60, and a note can never be grown past the board. |
| 3 | Move a note by dragging | Press anywhere on the note and drag. Pointer capture keeps the note following the pointer outside the element and outside the window. |
| 4 | Remove a note by dragging it over a trash zone | A fixed strip along the bottom of the board. It arms when a drag starts, the dragged note physically enters the strip, both turn red while hovering, and the note is deleted on drop — with a 6-second **Undo** toast. |

Behaviour that matters during review: **Escape cancels** a move or resize mid-gesture and restores the
exact previous geometry; a note dragged over the trash and then dragged back out is kept; every note
is clamped to stay fully visible, including after a window resize; a note released inside the strip
but outside the trash zone snaps back above it.

### Optional features — 5 of 5, in the order the brief prefers

- **I. Text editing** — double-click to edit inline; save with blur or `Cmd`/`Ctrl`+`Enter`, discard with `Escape`.
- **II. Bring to front** — pressing a note raises it above overlapping notes (monotonic z-index, persisted).
- **III. localStorage persistence** — the board is saved (debounced) and restored on load; invalid or unavailable storage falls back to an empty board instead of crashing.
- **IV. Note colors** — six pastel colors from swatches in the note's title bar.
- **V. REST API mock** — every change is also pushed through an asynchronous mock REST client (250–600 ms of real latency). The toolbar reports the sync state, settles back to idle after a success, and offers **Retry** when a sync fails.

## Using it

| Action | Mouse | Keyboard |
|---|---|---|
| Create | Drag on empty board · click for a default note · "+ New note" | `Tab` to "+ New note", then `Enter` |
| Select / focus | Press the note (also raises it) | `Tab` / `Shift+Tab` walks the notes in stacking order |
| Move | Drag the note | Arrow keys (8 px) |
| Resize | Drag the bottom-right corner | `Shift` + arrow keys (8 px) |
| Edit text | Double-click, then `Esc` to revert · `Cmd`/`Ctrl`+`Enter` to save | `Enter` / `F2`; `Escape` leaves the editor and returns focus to the note |
| Recolor | Hover the note, click a swatch | `Tab` to the swatches, `Space`/`Enter` |
| Delete | Drag onto the trash strip | `Delete` / `Backspace` |
| Cancel a gesture | `Escape` | `Escape` |

Notes are focusable elements with a visible focus ring and an accessible name built from their text,
so the board is operable without a pointer.

## Architecture

**Three layers, one direction of data flow: pure rules → state → view.** `src/domain/note.ts` holds
the `Note` model and every geometry rule as pure functions: normalising a drag rectangle, enforcing
minimum and default sizes, clamping inside the board, hit testing and the free-slot search behind
"+ New note". `src/app/store.ts` is a plain reducer (`create`, `updateGeometry`, `setText`,
`setColor`, `bringToFront`, `delete`, `restore`, `hydrate`) over `{ notes, zCounter }`, where a
monotonic counter — not array order — decides stacking. `src/app/NotesProvider.tsx` owns the single
store instance: it hydrates from `localStorage` inside the lazy `useReducer` initialiser, debounces
writes, and serialises sync calls so rapid edits coalesce instead of racing. Components only render
that state and report intent back as actions; nothing outside the tree mutates it.

**The four required features are one gesture underneath.** `src/hooks/useDrag.ts` opens a pointer
session on a primary `pointerdown`, calls `setPointerCapture`, listens on `window` for `pointermove` /
`pointerup` / `pointercancel`, and cancels on `Escape`. The caller takes a geometry snapshot at
`pointerdown` and keeps it in the session closure, so cancelling restores exact values instead of
recomputed ones; create, move and resize are three session factories over one engine. Board geometry
is measured once per gesture — never per frame — and every coordinate is converted into board space,
which is why positions survive scrolling, window offsets and the toolbar above the board. Keyboard
actions call the same clamping helpers, so the two input paths cannot drift apart.

**Persistence has two tiers because it has two jobs.** `src/infra/persistence.ts` is authoritative and
synchronous: a versioned payload (`{ version: 1, notes: [...] }`), a hand-written validator for every
field, and reads/writes that degrade to an empty board plus a warning instead of throwing.
`src/infra/mockApi.ts` is the async REST seam the brief asks for: a `NotesApi` interface plus a mock
that resolves after real `setTimeout` latency and can be told to fail, which feeds the toolbar's
syncing / synced / error states. Pointing it at a real endpoint replaces one object where the provider
is composed; no board code changes.

```
 pointer / keyboard
        │
        ▼
     Board ───────────────► reducer (pure rules) ───► NotesProvider
  (gestures, hit test)                                  ├─ localStorage   authoritative, validated
        │                                               └─ NotesApi mock  async, serialised
        ▼
  Note · TrashZone · Toolbar   ◄── re-rendered from state only, never mutated directly
```

| Layer | Lives in | Rule it keeps | Covered by |
|---|---|---|---|
| Domain and state | `domain/note.ts`, `app/store.ts` | Pure functions and a reducer: no DOM, no React | 27 unit tests |
| Input | `hooks/useDrag.ts`, `components/Board.tsx` | One gesture engine; geometry measured once per gesture | 6 hook tests + the interaction suite |
| Infrastructure | `infra/persistence.ts`, `infra/mockApi.ts` | Storage never throws at the app; the API is an interface | 13 unit tests |
| View | `components/`, `index.css` | Renders state, reports intent; no note data lives in the DOM | 43 tests (39 interaction + 4 stylesheet) |

## Project layout

```
src/
  domain/note.ts            Note model, palette, pure geometry helpers
  app/store.ts              Board reducer and actions (single source of truth)
  app/notesContext.ts       React context and useNotes hook
  app/NotesProvider.tsx     Hydration, debounced persistence, serialised sync, retry
  hooks/useDrag.ts          Pointer-capture drag engine (create, move, resize, cancel)
  components/Board.tsx      Board, gesture sessions, trash hit testing, keyboard nudging, undo
  components/Note.tsx       Note rendering, text editing, colour palette, keyboard map
  components/TrashZone.tsx  The drop strip
  components/Toolbar.tsx    New note, sync status, note count
  infra/persistence.ts      localStorage adapter + schema validation
  infra/mockApi.ts          Asynchronous REST mock
  test/setup.ts             jsdom stubs for PointerEvent capture
  App.tsx, main.tsx         Composition root
  index.css                 Design tokens, board, notes, states (one stylesheet, no preprocessor)
  *.test.ts(x)              Tests colocated with the code they cover
openspec/
  specs/                    6 capability specs (what the system must do)
  changes/archive/          3 completed, archived changes with proposal, design, tasks and deltas
docs/                       README screenshot
```

Nothing else: no `src/utils.ts` dumping ground, no barrel files, no wrapper components without a
consumer.

## Testing and verification

```bash
bun run test       # 88 tests, 7 files
bun run lint       # ESLint, flat config
bun run build      # tsc -b (strict) + vite build
```

| File | Tests | Covers |
|---|---|---|
| `domain/note.test.ts` | 16 | Clamping, min/default sizes, rect normalisation, hit testing, free-slot search |
| `app/store.test.ts` | 11 | Every reducer action, z-ordering, hydrate, restore, unknown ids |
| `infra/persistence.test.ts` | 10 | Round-trip, version/shape validation, malformed JSON, storage that throws |
| `infra/mockApi.test.ts` | 3 | Genuine async resolution, simulated latency, scripted failure |
| `hooks/useDrag.test.tsx` | 6 | Deltas, movement outside the element, Escape, `pointercancel`, sequential sessions |
| `index.css.test.ts` | 3 | Stylesheet guard: braces balanced, no Sass-only nesting, a background per note colour |
| `components/board.interactions.test.tsx` | 39 | Pointer and keyboard flows end to end: create/move/resize/clamp/trash/undo/stacking/edit/colour/restore/sync |

Browser verification, at 1024×768, with real input events (not synthetic DOM events):

| Browser | Mouse flows | Keyboard flows | Notes |
|---|---|---|---|
| Chrome | ✅ | ✅ | Driven over CDP with real mouse events |
| Firefox | ✅ | ✅ | Playwright, headless; pointer capture supported, no console or page errors |
| Edge | ⛔ | ⛔ | Not installed in the verification environment |

The Firefox runs asserted concrete values, e.g. create → `(120, 150)` at `240×160` with the expected
background colour; move → `+40/−30` exactly; resize → `300×190` with the top-left anchored; trash →
both danger states with the note inside the strip; reload → text, colour and geometry restored;
keyboard → arrows moved the note `64,64 → 80,72`, `Shift`+arrows resized `240×160 → 248×168`,
`Escape` discarded the draft and returned focus, `Delete` + Undo restored the note with its text.

## Decisions and assumptions

The brief left these open; each one is a deliberate choice, not an accident.

- **Draw-to-create** answers feature 1 as a single gesture: position *and* size chosen together, with
  a preview before committing. Click and toolbar button exist as fallbacks for discoverability.
- **Bounds**: default note 240×160, minimum 120×60, 8 px keyboard steps, notes always fully inside the
  board (no panning of a larger canvas).
- **Undo**: single-slot, 6-second window, only for deletions. A generic undo stack would be more
  machinery than this app earns.
- **Hit testing the trash by pointer position**, not by note overlap: it is the truthful target and
  behaves identically for tiny notes. The note is still allowed to travel into the strip so the target
  is physically reachable.
- **Stacking** uses a monotonic counter instead of array order or timestamps: deterministic, persists
  cleanly, and a restored note keeps the z-index it had.
- **Persistence order**: `localStorage` is authoritative and synchronous; the REST mock is an
  asynchronous mirror behind an interface. No backend was required, so none exists.
- **TypeScript strict** is enabled explicitly — the Vite template does not ship with it, and typing
  accuracy is one of the assessment criteria.
- **Bun** instead of the brief's pnpm: the scaffold already shipped `bun.lock` and bun is this
  environment's toolchain. The npm scripts are plain `vite` / `vitest` / `tsc` / `eslint` commands, so
  any package manager can run them.
- **No runtime dependency was added.** Vitest, jsdom and Testing Library are dev-only; React and React
  DOM remain the only production dependencies.

## License

No license file: this is assessment material, not a public library.
