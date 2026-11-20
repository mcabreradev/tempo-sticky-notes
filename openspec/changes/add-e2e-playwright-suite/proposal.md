# Proposal

## Why

Browser verification for this project was done ad hoc: scripts were written, run and thrown away, and
the README can only report the results. A reviewer cannot re-run them, and a future change could break
a real interaction without any committed test noticing — jsdom can cover state and DOM structure, but
not pointer capture, layout, CSS or cross-engine rendering.

## What Changes

- Add a Playwright end-to-end suite under `e2e/` that drives the built application in real Chromium and
  Firefox at the assessment's minimum viewport (1024×768), using real pointer and keyboard input.
- Cover the four required interactions, the cancel paths, undo, text editing, colours, stacking,
  persistence across reload, the sync status machine and the keyboard equivalents.
- Add the tooling around it: Playwright config with a `webServer`, a `test:e2e` script, an ESLint block
  for the suite, a TypeScript project so the suite is type-checked, and ignore rules for its artifacts.
- Document the suite in the README (how to install browsers, run it, and what it covers).

This is a tooling change: no product behaviour changes, so the change sets `skip_specs: true` and the
existing capability specs stay untouched.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — the suite asserts the requirements already specified)

## Impact

- **Code**: new `e2e/` directory, `playwright.config.ts`, `tsconfig.e2e.json`; edits to
  `package.json` (scripts), `eslint.config.js`, `tsconfig.json`, `.gitignore`, `README.md`.
- **Dependencies**: `@playwright/test` as a dev dependency. Browser binaries are not npm packages; they
  are installed per machine with `bunx playwright install chromium firefox`.
- **Gates**: `bun run test:e2e` becomes the third gate next to `test` and `build`; it is deliberately
  separate so unit tests stay fast and browserless.
