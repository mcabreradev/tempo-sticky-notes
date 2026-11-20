# Tasks

## 1. Theme resolution and storage

- [x] 1.1 `src/app/theme.ts`: preference type, storage read/parse with fallback, resolution against the system scheme — verified: 11 unit tests cover all three preferences, a corrupt value, throwing storage and both system schemes
- [x] 1.2 `src/app/useTheme.ts`: read on mount, persist on change, subscribe to `matchMedia` only in System mode — verified: component test sees `data-theme` change and storage written

## 2. Applying the palette

- [x] 2.1 `index.css`: light tokens in `:root`, dark tokens under `:root[data-theme='dark']`, `color-scheme` following the resolved value; the `prefers-color-scheme` duplication is gone — verified: e2e asserts the toolbar background changes between the two palettes
- [x] 2.2 `index.html`: pre-paint inline script that sets `data-theme` before the bundle runs — verified: e2e reloads with Dark selected and reads `data-theme="dark"` before React mounts

## 3. The control

- [x] 3.1 `components/ThemeToggle.tsx`: radiogroup with System / Light / Dark, checked state from the preference, wired into the toolbar — verified: component tests assert `aria-checked` and the applied attributes
- [x] 3.2 Keyboard reachability of the control — verified: e2e focuses an option and presses Enter

## 4. Verification and documentation

- [x] 4.1 `e2e/theme.spec.ts`: system default, dark applied + persisted across reload, light overriding a dark system, live system change, corrupt preference fallback, keyboard operation — verified on chromium and firefox
- [x] 4.2 Full gate: lint 0, `tsc -b` 0, 127/127 unit, build ✓, 60/60 e2e
- [x] 4.3 README: control documented in the interactions table, storage key, layout, test tables and decisions

## Verification record

- `bunx tsc -b` → exit 0
- `bun run lint` → exit 0
- `bun run test` → 12 files, 127 tests passed
- `bun run build` → built in 1.19 s
- `bun run test:e2e` → 60 passed (30 scenarios × chromium + firefox), 27.8 s
- Manual: dark and light screenshots of the running build at 1024×768 reviewed with vision
