# Tasks

## 1. Boot safety

- [x] 1.1 Resolve `window.localStorage` inside a guard so a blocked accessor cannot throw out of the reducer initialiser — verified: `persistence.test.ts` "degrades instead of throwing when the localStorage accessor itself is blocked" green; Chrome with a throwing accessor renders the board instead of a blank page
- [x] 1.2 Add an error boundary around the app with a recoverable screen — verified: `ErrorBoundary.test.tsx` (children, fallback, reload) green
- [x] 1.3 Reject persisted notes below the domain minimum size — verified: `persistence.test.ts` "rejects notes below the domain minimum size" green

## 2. State and rendering

- [x] 2.1 Split the context into state / dispatch / sync — verified: 109-test suite green; `Note` no longer reads board state
- [x] 2.2 Derive persistence and sync from state instead of from a `dispatch` wrapper; keep the serialised in-flight queue — verified: sync lifecycle, failure, retry and "serializes overlapping saves" tests green
- [x] 2.3 Make `bringToFront`, `updateGeometry` and `clampAll` return the same state when nothing changes — verified: `store.test.ts` no-op assertions green; "does not raise, re-render or sync when pressing a note that is already on top" green
- [x] 2.4 Clamp the whole board with one `clampAll` action and register the resize listener once — verified: `board.regressions.test.tsx` "clamps every note into the new bounds" green
- [x] 2.5 Freeze the initial state, collapse duplicate ids on hydrate, refuse to restore over a live note — verified: `store.test.ts` green

## 3. Geometry and gestures

- [x] 3.1 Measure the board and the trash strip from the DOM; delete the duplicated `TRASH_ZONE_HEIGHT` constant — verified: `boardGeometry.test.ts` green, interaction suite's 568px usable-area assertions green
- [x] 3.2 Replace the `as DOMRect` casts with a typed measure module — verified: lint and `tsc -b` clean
- [x] 3.3 Tear down window listeners and pointer capture when `useDrag`'s host unmounts — verified: `useDrag.test.tsx` "removes its window listeners when the host unmounts mid-drag" green

## 4. Interaction and accessibility

- [x] 4.1 Reset the skip-commit flag on every edit so a swallowed blur cannot disable saving — verified: `board.regressions.test.tsx` "still commits the next edit once an Escape has been cancelled" green
- [x] 4.2 Give the palette radiogroup roving tabindex and arrow-key selection — verified: `board.regressions.test.tsx` "exposes a single tab stop and moves the selection" green; Playwright keyboard run green
- [x] 4.3 Hand focus to the neighbouring note when the focused one is deleted — verified: `board.regressions.test.tsx` "hands focus to the neighbouring note" green
- [x] 4.4 Move the sync announcement into its own live region and keep the visible chrome decorative — verified: `sr-only` rule asserted by the stylesheet test; Playwright sync-lifecycle run green
- [x] 4.5 Make the undo window pause while the toast is hovered or focused — verified: existing undo tests green (expiry still closes it)
- [x] 4.6 Raise a note from any of its controls, not only its body — verified: `board.regressions.test.tsx` "raises a note pressed by any of its controls" green
- [x] 4.7 Add `eslint-plugin-jsx-a11y` to the lint gate — verified: `bun run lint` clean with the plugin enabled

## 5. Tooling and documentation

- [x] 5.1 Replace the regex stylesheet guard with a PostCSS AST test — verified: `index.css.test.ts` 7 tests green
- [x] 5.2 Ignore `.worktrees/` in the versioned `.gitignore` — verified: `git status` clean inside the worktree
- [x] 5.3 Update the README (test counts, architecture, storage guarantee) — verified: counts match `bun run test` and `bun run test:e2e`
- [x] 5.4 Full gate on the branch: lint, unit tests, production build, browser suite — verified: see the verification record

## Verification record

- `bun run lint` — 0 problems (with `jsx-a11y` recommended)
- `bun run test` — 112 tests, 11 files, all green
- `bun run build` — `tsc -b` clean, Vite build OK
- `bun run test:e2e` — Chromium + Firefox, all green against the production build
- Chrome, storage accessor blocked — the board renders instead of a blank page
