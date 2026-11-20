# Proposal: Harden the board internals after code review

## Why

A full review of the board (`src/`, 3k lines) found one boot-blocking defect and a set of
React, state and accessibility problems that the existing suite could not see:

- **Blocked `localStorage` access took the whole app down.** `window.localStorage` was resolved as a
  default parameter, i.e. outside the `try` that was supposed to protect it. In Safari private mode
  or with third-party storage blocked, the throw happened inside the `useReducer` initialiser —
  during render — and, with no error boundary, the page rendered blank.
- **One context value carried state, dispatch, sync status and retry**, so every note re-rendered on
  every state change (`memo` cannot stop context-driven renders). Measured: 28 note renders for two
  notes across a single five-event drag.
- **Dispatch had side effects**: every action scheduled a persistence write and a REST save, so
  pressing a note that was already on top bumped the z-counter and re-synced an identical board.
- **The trash strip height existed twice** (a TypeScript constant and the stylesheet), and the board
  measured the DOM only for the trash, not for its own usable area.
- **`useDrag` leaked its window listeners** when its host unmounted mid-gesture.
- **Accessibility**: the colour swatches were a `radiogroup` without roving tabindex, deleting the
  focused note dropped the caret on `<body>`, the sync block announced the count and the Retry
  button on every save, and the undo offer could not be paused.
- **No accessibility lint** in a project whose main claim is keyboard parity.

## What changes

Behaviour-preserving hardening of the existing features (no new user-facing feature):

1. Storage access is resolved inside a guard; a blocked accessor degrades to an empty board.
2. An error boundary renders a recoverable screen instead of a blank page.
3. The provider exposes three contexts (state, dispatch, sync) so leaves that only dispatch do not
   re-render; persistence and sync are derived from state instead of from `dispatch`.
4. The reducer no-ops on actions that change nothing, clamps the whole board with one `clampAll`
   action, and refuses to restore over a live note.
5. Board geometry is measured from the DOM (including the trash strip) in one module.
6. `useDrag` tears its listeners down on unmount.
7. ARIA and focus improvements: roving tabindex on the palette, focus handoff on delete, a dedicated
   live region, a pausable undo window, and `jsx-a11y` in the lint gate.

## Out of scope

- New features, visual redesign, or changing the interaction model.
- `requestAnimationFrame` coalescing of `pointermove`: it changes the hook's synchronous contract
  that the interaction tests and the mid-gesture visual states depend on. The render storm is
  addressed by the context split, `memo` and the reducer no-ops instead.
- The Playwright suite configuration (already hardened in a separate change).
