# Tasks

## 1. Project setup

- [x] 1.1 Add dev dependencies (`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`) and a `test` script; `bun install` resolves and lockfile updates — verified: `vitest@5.1.1`, `jsdom@31.0.1`, `@testing-library/react@16.3.3`, `bun run test` executes
- [x] 1.2 Enable `strict` in `tsconfig.app.json`; add Vitest config + test setup stubbing `setPointerCapture`; `bun run build` and `bun run lint` still pass — verified: `bunx tsc -b` exit 0, `bun run lint` exit 0, `bun run build` exit 0
- [x] 1.3 Replace template `index.css`/`App.css` with the board design tokens (CSS vars, dark scheme) used by later components — verified: `src/index.css.test.ts` asserts balanced braces and a background per note color; real-browser check of computed styles

## 2. Domain layer

- [x] 2.1 Create `src/domain/note.ts` (Note type, geometry helpers: clamp-to-board, min-size, rect-from-points, point-in-rect) with unit tests passing under `bun run test` — verified: 15 tests in `note.test.ts`
- [x] 2.2 Create `src/app/store.ts` (state type, reducer, actions, z-counter) with unit tests for every action, including exact cancel-restore snapshots — verified: 9 tests in `store.test.ts`

## 3. Infrastructure layer

- [x] 3.1 Create `src/infra/persistence.ts` (schema-v1 validator, load, debounced save, fail-safe wrappers) with unit tests for valid/invalid/throwing storage — verified: 10 tests in `persistence.test.ts` (save debounce lives in the provider)
- [x] 3.2 Create `src/infra/mockApi.ts` (`NotesApi` interface + `MockRestNotesApi` with real async latency and injectable failure) with unit tests — verified: 3 tests in `mockApi.test.ts` (async, latency, scripted failure)

## 4. Interaction engine

- [x] 4.1 Create `src/hooks/useDrag.ts` (pointer capture, per-gesture snapshot, Escape cancel, board-coordinate conversion) with a hook test covering cancel and out-of-element movement — verified: 6 tests in `useDrag.test.tsx`

## 5. UI components (core features 1–4)

- [x] 5.1 Build `Board` + `Toolbar` + `TrashZone` shell with the design tokens; renders empty board at 1024×768 without overflow (component test) — verified: full-app render in `board.interactions.test.tsx` plus manual browser check at 1024×768
- [x] 5.2 Implement drag-to-create with preview rectangle (min-size clamp, board clamp) + click fallback + "New note" cascade button; component tests for all three creation paths — verified: 5 creation tests, plus CDP-driven drag in Chrome landing at exactly (120,150) 240×160
- [x] 5.3 Build `Note` component: move-by-drag, resize handle, bring-to-front, Escape cancel; component tests for move/resize/z-order — verified: move/resize/cancel/z-order tests; browser move preserved grab offset, resize kept top-left anchored
- [x] 5.4 Wire `TrashZone`: arm during note drag, danger hover, drop-to-delete, cancel-safe; component test deleting via synthetic drag — verified: 3 tests; browser showed `trash--danger` on hover and deletion on drop
- [x] 5.5 Note text editing (double-click → textarea, blur/Cmd-Enter save, Escape revert, placeholder for empty) with component test — verified: 3 tests; browser double-click + typed text + blur persisted the text
- [x] 5.6 Note color palette (recolor note, persisted) with component test — verified: test + browser click on the green swatch

## 6. Persistence wiring

- [x] 6.1 Wire `NotesProvider`: restore on mount, debounced localStorage save on change, storage failures non-fatal (component/integración test with fake storage) — verified: restore, corrupt-payload and debounced-save tests; browser reload restored position, text and color
- [x] 6.2 Wire async sync via `MockRestNotesApi` with status indicator (idle/syncing/synced/error) and failure handling test — verified: 3 tests; browser showed Local draft → Syncing… → Synced

## 7. Gates and verification

- [x] 7.1 `bun run lint`, `bun run build`, `bun run test` all green from the worktree; outputs recorded — verified: eslint exit 0, tsc -b exit 0, 72/72 tests, build 234.87 kB (74.43 kB gzip)
- [x] 7.2 Manual browser verification in Chrome at 1024×768: create (drag/click/button), move, resize, trash-delete incl. cancel paths, text edit, colors, z-order, reload persistence, sync status; record what was actually tested — verified in Chrome via CDP input; NOT tested: Firefox, Edge, touch, other OSes
- [x] 7.3 Rewrite README.md in English: description, prerequisites, run/test/build instructions, usage, implemented core + optional features, known limitations, and the 2–3 paragraph architecture description required by the assessment — verified: README.md replaced

## 8. OpenSpec closure

- [x] 8.1 Update this tasks.md to reflect the real implementation status; `openspec validate build-sticky-notes-board --type change` passes and output is recorded — verified: validate reports valid:true, 0 failed

## Workflow follow-up

- Archive the change after the final review with the user (not archived automatically).

## Verification record

- Bug found during manual verification that unit tests could not catch: `&--modifier` Sass-style
  nesting in `index.css` is invalid native CSS nesting, so browsers dropped every note color rule
  and notes rendered transparent. Fixed with flat selectors and guarded by `src/index.css.test.ts`.
- Browser caveat: `Emulation.setDeviceMetricsOverride` resets between CDP sessions; an early
  trash-drop check failed only because the viewport had reverted to 800×479 and the pointer was
  released outside it. Re-verified at 1024×768: deletion works.
