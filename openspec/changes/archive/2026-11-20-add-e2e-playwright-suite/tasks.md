# Tasks

## 1. Tooling

- [x] 1.1 Add `@playwright/test` as a dev dependency and install the Chromium and Firefox binaries — verified: `bunx playwright --version` → 1.65.1; browsers present in `~/Library/Caches/ms-playwright` (chromium-1255, firefox-1572)
- [x] 1.2 Add `playwright.config.ts` with the `webServer` (build + preview on port 4173), the Chromium and Firefox projects, and a 1024×768 viewport — verified: the suite starts the built app and runs both projects
- [x] 1.3 Type-check and lint the suite: `tsconfig.e2e.json` referenced from the root tsconfig, an ESLint block for `e2e/`, and a `test:e2e` script — verified: `bunx tsc -b` exit 0 and `bun run lint` exit 0
- [x] 1.4 Ignore Playwright artifacts (`test-results/`, `playwright-report/`) — verified: `git status` stays clean after a full run

## 2. Interaction specs

- [x] 2.1 `e2e/interactions.spec.ts`: create by drag (exact geometry), by click (centred default), by toolbar (cascade), minimum-size and board-edge clamping — verified on chromium and firefox
- [x] 2.2 Same file: move with preserved grab offset, Escape cancels a move, corner resize anchors the top-left corner — verified on chromium and firefox
- [x] 2.3 Same file: dragging over the trash shows both danger states and deletes on drop; undo restores the note; dragging out of the trash keeps it and snaps it back — verified on chromium and firefox
- [x] 2.4 Same file: stacking on press, text editing saved with Cmd/Ctrl+Enter and discarded with Escape, colour change from the palette — verified on chromium and firefox

## 3. Persistence and keyboard specs

- [x] 3.1 `e2e/persistence.spec.ts`: a reload restores geometry, text and colour; a corrupt payload starts empty; the sync status reaches `Synced` and settles to `Saved locally` — verified on chromium and firefox
- [x] 3.2 `e2e/keyboard.spec.ts`: the note is focusable with an accessible name, arrows move it, Shift+arrows resize it, Enter/Escape drive the editor, Delete + Undo remove and restore it — verified on chromium and firefox

## 4. Verification and documentation

- [x] 4.1 Run the full suite in Chromium and Firefox and record the result — verified: `48 passed (25.4s)`, 24 scenarios per engine
- [x] 4.2 Update the README: how to install browsers, how to run the suite, what it covers, and the fact that the browser verification is now reproducible — verified: README testing section rewritten, layout and decisions updated
- [x] 4.3 Full gate: `bun run lint`, `bunx tsc -b`, `bun run test`, `bun run build`, `bun run test:e2e` — verified below

## Verification record

- `bun run test:e2e` → **48 passed** in 25.4 s across the chromium and firefox projects.
- `bun run test` → 89 passed (jsdom).
- `bun run lint` → exit 0. `bunx tsc -b` → exit 0. `bun run build` → exit 0.
- Three first-run failures were defects in the **tests**, not the app, and are documented here so they
  are not re-introduced: (a) stacking was compared by DOM index, which re-orders when z-values change;
  (b) Firefox does not deliver pointer events for coordinates outside the window, so a drag must stay
  inside the viewport; (c) labelling a note raises it, which changes the baseline the stacking test
  measures.
- Not verified: Microsoft Edge (not installed in this environment), touch input, non-macOS platforms.
