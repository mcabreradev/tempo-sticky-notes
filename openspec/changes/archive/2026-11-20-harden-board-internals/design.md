# Design: Harden the board internals

## Context split instead of memo tricks

`memo(Note)` was already in place but every note still re-rendered, because `Note` read the whole
context object and that object changed identity on every action. Splitting the value into three
contexts — state, dispatch, sync — makes the dispatch identity genuinely stable (`useReducer`'s
dispatch never changes), so a leaf that only dispatches stops re-rendering. The board keeps
subscribing to state, which is what a board must do.

Consequence for the components: props carry intents that need board geometry (move, resize, nudge,
delete); the context carries intents that are pure state changes (colour, stacking, text). That
rule is written down in the components, because "half props, half context" was previously arbitrary.

## Sync derived from state

The provider no longer wraps `dispatch` to schedule work. Instead:

- a persistence effect writes the state after a debounce;
- a sync effect compares the current state reference with the last one it synced, which also makes
  the first render (hydration) and StrictMode's double effect quiet;
- the in-flight guard keeps one save at a time and queues the newest snapshot, preserving the
  existing "rapid edits coalesce instead of racing" behaviour.

This is what removes the `stateRef` + `runSyncRef` pair: the effects see the state directly, and
`retry` closes over the current state.

## Reducer rules: a no-op must not allocate

`bringToFront` on the note that is already on top, `updateGeometry` with identical values, and
`clampAll` when nothing falls outside the bounds all return the **same state object**. Combined with
effects that key on `state`, "nothing changed" now means "no write, no sync, no render".

`clampAll` exists because the resize handler used to dispatch one action per note; one action for
the whole board keeps the listener registered once (`dispatch` and the measure function are stable)
and the reducer pass singular.

## Geometry measured, not declared

`app/boardGeometry.ts` reads the board and the trash strip from the DOM and derives the usable area
from the strip's own top edge. The TypeScript constant that duplicated `height: 72px` is gone, so the
stylesheet is the only place the strip height is stated, and hit testing cannot drift from it.

## Trade-off: no rAF coalescing

`pointermove` still dispatches one action per event. Coalescing into `requestAnimationFrame` would
have meant re-deriving the synchronous contract of `useDrag` that six hook tests and the mid-gesture
visual assertions (preview rectangle, trash danger state) depend on. The measurable problem — every
note re-rendering per frame — is fixed at the source, and a drag now touches one note.
