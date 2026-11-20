# Tasks

## 1. Undo after deletion

- [x] 1.1 Add a `restore` action to the board reducer that keeps `zCounter` monotonic — verified: `store.test.ts` (2 new tests) green under `bun run test`
- [x] 1.2 Add the Board-level undo buffer, the 6 s expiry and the toast with its Undo action — verified: `board.interactions.test.tsx` undo tests (restore + expiry) green
- [x] 1.3 Style the toast and keep it out of the way of the trash strip — verified: rendered in Chrome and Firefox runs, screenshot reviewed

## 2. Trash-strip drag feedback

- [x] 2.1 Clamp moves against the full board and drops against the usable area (snap-back) — verified: tests "lets the dragged note visually enter the trash strip" and "snaps the note back above the strip" green; Firefox run shows the note at top=520 over a 478 usable limit

## 3. Sync lifecycle

- [x] 3.1 Settle the status to idle 1.5 s after a successful sync, cancelling the timer on new syncs and on unmount — verified: "settles back to the idle state" test green
- [x] 3.2 Expose `retrySync` through the context and a Retry control in the toolbar — verified: "offers a manual retry after a failed sync" test green

## 4. Content and geometry robustness

- [x] 4.1 Make the note body scroll instead of clipping long text — verified: CSS reviewed, CSS guard test green (`bun run test`)
- [x] 4.2 Make `clamp` prefer the minimum when the range is inverted — verified: "prefers the minimum when the range is inverted" unit test green

## 5. Verification and documentation

- [x] 5.1 Full gate on the worktree: lint, type-check, tests, production build — verified: eslint 0, `tsc -b` 0, 81/81 tests, build OK
- [x] 5.2 Browser verification of the changed behaviours in Chrome and Firefox at 1024×768 — verified: Chrome via CDP; Firefox via Playwright with real mouse input (create/move/resize/trash/undo/edit/color/reload all passed, no console errors)
- [x] 5.3 Update README (features, undo, retry, test count, Firefox run, limitations) — verified: README sections updated

## Verification record

- Chrome run: undo offered after a trash drop and restored the note; drag enters the strip; sync settles to "Saved locally".
- Firefox run (Playwright, headless, real mouse events, 1024×768): pointer capture supported; create → (120,150) 240×160; move +40/−30; resize → 300×190 anchored; trash hover shows `trash--danger` + `note--danger` with the note at top 520 (usable limit 478); deletion; undo restores; text edit; colour change; reload restores text, colour and geometry. No console or page errors.
- Not verified: Microsoft Edge, touch input, non-macOS platforms.
