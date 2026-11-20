# Design

## Context

The stylesheet currently keys the dark palette off `@media (prefers-color-scheme: dark)`, which leaves no
room for a manual choice (`index.css`). The board itself is unaffected by this change: only the tokens
that paint the chrome, the notes and the trash strip change source.

## Goals / Non-Goals

**Goals:**

- One place decides which palette is in effect, and the DOM says so (`data-theme` on `<html>`).
- A manual choice beats the OS; System keeps behaving exactly as the app does today.
- No flash of the wrong theme on reload.

**Non-Goals:**

- No per-note theme, no theme editor, no high-contrast or custom palettes.
- No server-side preference (there is no server).

## Decisions

### 1. Resolve the theme in JavaScript, key the CSS off one attribute

Instead of duplicating the dark token block in two CSS contexts (`[data-theme='dark']` and a system media
query), the app resolves the effective scheme — `preference === 'system' ? systemScheme : preference` —
and writes `data-theme="light|dark"` on `document.documentElement`. The preference itself is exposed
separately as `data-theme-preference` for the control. CSS then needs two blocks only: light in `:root`
and dark under `[data-theme='dark']`, plus `color-scheme` matching the resolved value so native
scrollbars and form controls follow.

Alternatives considered: keeping the media query and adding two override blocks (rejected — three copies
of the same tokens, and the CSS would encode the precedence rule twice); a CSS-only `light-dark()`
function (rejected — it cannot express the three-way preference, only two states).

### 2. System mode subscribes to `matchMedia`, and only in that mode

`useTheme` registers a `change` listener on `matchMedia('(prefers-color-scheme: dark)')` while the
preference is `system` and removes it otherwise, which is what makes the live-follow requirement hold
without polling.

### 3. The preference lives beside the board, not inside it

Storage key `sticky-notes-theme-v1` with a hand-written guard (`system | light | dark`). Keeping it out of
the board payload means a theme change cannot trigger a board save or a sync, and a corrupt board payload
cannot reset the theme (or vice versa).

### 4. A pre-paint script in `index.html`

A six-line inline script runs before the module bundle: it reads the stored preference, resolves it
against `matchMedia`, and sets `data-theme` on `<html>`. React then adopts the value instead of deciding
it, which removes the flash. The script is the only place duplicated logic is allowed, and it is
deliberately minimal.

### 5. A radiogroup in the toolbar

Three `role="radio"` buttons inside a labelled `role="radiogroup"`: arrow-key navigation and the checked
state come from the platform, the control is keyboard-reachable for free, and the same semantics the note
palette already uses keep the codebase consistent.

## Risks / Trade-offs

- The pre-paint script can drift from `app/theme.ts`. Mitigation: both read the same storage key and the
  same three values, and the e2e reload assertion covers the pairing.
- Server-rendered HTML would need this handled differently; this app is a static SPA, so the inline script
  is the right tool.
- `data-theme` is also what the tests read, so a bug in resolution shows up as a failing test rather than
  as a silently wrong colour.
