# Tasks

## 1. Test hooks in the components

- [x] 1.1 Add `data-testid` to the board, the preview, the note and its parts (bar, body, editor, resize handle, colour swatches), the trash strip, the sync indicator, the new-note button and the undo toast — verified: the browser suite finds every element through `getByTestId` and passes
- [x] 1.2 Expose interaction state as attributes: `data-color`, `data-dragging`, `data-over-trash` on the note and `data-state` (idle/armed/danger) on the trash strip — verified: the suite asserts `data-state="danger"` and `data-over-trash="true"` mid-drag, and the component tests still pass

## 2. Browser suite rewritten on the hooks

- [x] 2.1 `e2e/support.ts` and the three specs select by `data-testid` and assert state through `data-*` attributes, keeping role queries where they check accessible names — verified: `bun run test:e2e` → 48 passed
- [x] 2.2 Confirm the suite no longer depends on BEM classes: grep the `e2e/` folder for `note--`, `trash--`, `board__` — verified: no matches

## 3. Verification and documentation

- [x] 3.1 Full gate: `bun run lint`, `bunx tsc -b`, `bun run test`, `bun run build`, `bun run test:e2e` twice for stability — verified below
- [x] 3.2 README: state that the browser suite selects by test id and asserts state through data attributes — verified: README testing section updated

## Verification record

- `bunx tsc -b` exit 0 · `bun run lint` exit 0 · `bun run test` 89 passed · `bun run test:e2e` 48 passed.
- `grep -rn "note--\|trash--\|board__\|note__" e2e/` → no matches: the suite is decoupled from the
  stylesheet.
- The colocated component tests still assert the classes the components render; that is intentional and
  documented in the design.
