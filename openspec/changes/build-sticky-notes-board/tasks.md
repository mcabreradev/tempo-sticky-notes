# Tasks

## 1. Project setup

- [ ] 1.1 Add dev dependencies (`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`) and a `test` script; `bun install` resolves and lockfile updates
- [ ] 1.2 Enable `strict` in `tsconfig.app.json`; add Vitest config + test setup stubbing `setPointerCapture`; `bun run build` and `bun run lint` still pass
- [ ] 1.3 Replace template `index.css`/`App.css` with the board design tokens (CSS vars, dark scheme) used by later components

## 2. Domain layer

- [ ] 2.1 Create `src/domain/note.ts` (Note type, geometry helpers: clamp-to-board, min-size, rect-from-points, point-in-rect) with unit tests passing under `bun run test`
- [ ] 2.2 Create `src/app/store.ts` (state type, reducer, actions, z-counter) with unit tests for every action, including exact cancel-restore snapshots

## 3. Infrastructure layer

- [ ] 3.1 Create `src/infra/persistence.ts` (schema-v1 validator, load, debounced save, fail-safe wrappers) with unit tests for valid/invalid/throwing storage
- [ ] 3.2 Create `src/infra/mockApi.ts` (`NotesApi` interface + `MockRestNotesApi` with real async latency and injectable failure) with unit tests

## 4. Interaction engine

- [ ] 4.1 Create `src/hooks/useDrag.ts` (pointer capture, per-gesture snapshot, Escape cancel, board-coordinate conversion) with a hook test covering cancel and out-of-element movement

## 5. UI components (core features 1–4)

- [ ] 5.1 Build `Board` + `Toolbar` + `TrashZone` shell with the design tokens; renders empty board at 1024×768 without overflow (component test)
- [ ] 5.2 Implement drag-to-create with preview rectangle (min-size clamp, board clamp) + click fallback + "New note" cascade button; component tests for all three creation paths
- [ ] 5.3 Build `Note` component: move-by-drag, resize handle, bring-to-front, Escape cancel; component tests for move/resize/z-order
- [ ] 5.4 Wire `TrashZone`: arm during note drag, danger hover, drop-to-delete, cancel-safe; component test deleting via synthetic drag
- [ ] 5.5 Note text editing (double-click → textarea, blur/Cmd-Enter save, Escape revert, placeholder for empty) with component test
- [ ] 5.6 Note color palette (recolor note, persisted) with component test

## 6. Persistence wiring

- [ ] 6.1 Wire `NotesProvider`: restore on mount, debounced localStorage save on change, storage failures non-fatal (component/integración test with fake storage)
- [ ] 6.2 Wire async sync via `MockRestNotesApi` with status indicator (idle/syncing/synced/error) and failure handling test

## 7. Gates and verification

- [ ] 7.1 `bun run lint`, `bun run build`, `bun run test` all green from the worktree; outputs recorded
- [ ] 7.2 Manual browser verification in Chrome at 1024×768: create (drag/click/button), move, resize, trash-delete incl. cancel paths, text edit, colors, z-order, reload persistence, sync status; record what was actually tested
- [ ] 7.3 Rewrite README.md in English: description, prerequisites, run/test/build instructions, usage, implemented core + optional features, known limitations, and the 2–3 paragraph architecture description required by the assessment

## 8. OpenSpec closure

- [ ] 8.1 Update this tasks.md to reflect the real implementation status; `openspec validate build-sticky-notes-board --type change` passes and output is recorded

## Workflow follow-up

- Archive the change after the final review with the user (not archived automatically).
