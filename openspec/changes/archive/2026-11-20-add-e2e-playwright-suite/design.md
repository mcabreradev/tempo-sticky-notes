# Design

## Context

The app is a Vite SPA whose behaviour lives in pointer and keyboard events (see `openspec/specs/`).
Vitest with jsdom already covers pure rules, the reducer, the drag hook and DOM structure, but jsdom has
no layout: `getBoundingClientRect()` returns zeros, `setPointerCapture` is a stub, and CSS is stubbed
out. Everything that made the last round of fixes necessary — the trash strip's real position, the
`&--modifier` stylesheet bug, the dark-mode contrast regression — was invisible to jsdom.

## Goals / Non-Goals

**Goals:**

- A suite the reviewer can run with two commands, on both engines the assessment names and that exist
  here (Chromium and Firefox).
- Deterministic, non-flaky assertions: exact geometry numbers, class states and text, not screenshots.
- Typed tests: the suite is part of `tsc -b`.

**Non-Goals:**

- No visual regression screenshots (no baseline images to maintain for a one-off assessment).
- No Edge project: the browser is not installed in this environment; the README states it.
- No CI wiring (the repository has no CI on purpose).

## Decisions

### 1. Test the production build, not the dev server

`webServer.command` runs `bun run build && bun run preview --port 4173 --strictPort`. The suite therefore
exercises the same bundle a reviewer would ship, and it catches build-time regressions (the CSS nesting
bug shipped fine in dev and only misbehaved once parsed). The build takes about a second, which is cheap
next to browser start-up.

### 2. Two projects, one spec folder

`projects: [chromium, firefox]` over the same specs. Both engines get the full interaction matrix at
`viewport: 1024×768`, mirroring the assessment's minimum resolution; the suite runs them in parallel.

### 3. State reset without breaking the persistence test

A `beforeEach` navigates, clears `localStorage` and reloads, so every test starts from an empty board.
The persistence spec then makes its own changes and reloads **within** the test — that reload is the
assertion, so an `addInitScript` blanket clear would be wrong here.

### 4. Assertions on values, not pixels

Geometry is asserted against the exact numbers the app computes (`left`, `top`, `width`, `height` in
style), states against classes (`note--dragging`, `trash--danger`) and text (`Synced`, `Saved locally`).
That keeps the suite honest without a screenshot baseline, and a failure message names the number that
moved.

### 5. Suite layout

- `e2e/interactions.spec.ts` — create (drag, click, button), move, resize, clamps, trash drag/undo,
  stacking, text editing, colours.
- `e2e/persistence.spec.ts` — reload restores the board; the sync status machine reaches `Synced` and
  settles to `Saved locally`.
- `e2e/keyboard.spec.ts` — focus model, arrow move/resize, Enter/Escape editing, Delete + undo.

## Risks / Trade-offs

- Browser binaries (~150 MB per engine) must be installed once per machine; the README documents the
  command. A reviewer without them gets a clear Playwright error telling them to install.
- Real-input tests are inherently slower than jsdom: the suite takes tens of seconds, which is why it is
  a separate script instead of part of `bun run test`.
- Timing: sync assertions wait on the status text with an explicit timeout instead of fixed sleeps, so a
  slow machine does not fail the run.
