# Proposal

## Why

The app only follows the operating system's colour scheme: there is no way to choose a theme, so a user
on a light OS cannot read the board at night and a user on a dark OS cannot present it in light mode.
Every other preference in the app (notes, colours, layout) is explicit; the theme should be too.

## What Changes

- Add a theme control in the toolbar with three options: **System**, **Light** and **Dark**.
- Resolve the effective theme in one place and expose it on the document root (`data-theme="light|dark"`)
  so both the UI and the tests can see what is actually applied.
- Follow the operating system while in System mode, including live changes, and stop following it as
  soon as the user picks Light or Dark.
- Remember the choice across reloads, stored separately from the board payload, and fall back to System
  when the stored value is missing or invalid.
- Apply the chosen theme before the first paint, so the app never flashes the wrong scheme.

## Capabilities

### New Capabilities

- `theme-preference`: explicit light/dark/system selection for the whole surface, with persistence and
  live system following.

### Modified Capabilities

(none — board behaviour is untouched)

## Impact

- **Code**: new `app/theme.ts` (pure resolution + storage helpers), `app/useTheme.ts` (hook),
  `components/ThemeToggle.tsx`; edits to `components/Toolbar.tsx`, `components/Board.tsx`,
  `index.css` (tokens keyed off `data-theme`), `index.html` (pre-paint script), `App.tsx`.
- **Tests**: new unit tests for the resolution helpers, a component test for the control, and
  `e2e/theme.spec.ts` in the browser suite.
- **Dependencies**: none.
