# Design

## Context

The change adjusts behaviour already shipped in `build-sticky-notes-board` (see proposal.md → Why).
The existing architecture already separates geometry, state and gestures, so each fix lands in one
layer: `domain/note.ts` (clamp), `app/store.ts` (restore), `app/NotesProvider.tsx` (sync lifecycle),
`components/Board.tsx` (undo state, full-size drag clamp), `components/Toolbar.tsx` (retry).

## Goals / Non-Goals

**Goals:**

- Make deletion reversible without introducing a general undo stack.
- Couple the danger cue to the note's own position instead of only the pointer.
- Give the sync indicator an honest lifecycle, including recovery.

**Non-Goals:**

- No undo/redo for moves, resizes, edits or color changes; only the last deletion is recoverable.
- No offline queue or persisted retry: the mock API lives in memory per tab.

## Decisions

### 1. Undo is a single-slot buffer held in the Board, not in the store

The Board keeps the deleted note as `removedNote` and exposes an "Undo" action for six seconds
(`UNDO_WINDOW_MS`), driven by a `setTimeout` effect. Restoring dispatches a dedicated
`restore` action rather than `create`, so the note comes back with its original id, geometry, text,
color and `zIndex` instead of being re-stacked to the top; the action raises `zCounter` to
`max(zCounter, note.zIndex)` to keep stacking monotonic for future notes. Alternatives considered: a
general undo stack in the reducer (rejected — a stack that only ever holds one deletion would be
dead weight) and a toast owned by a global store (rejected — it is presentation state).

### 2. Drags clamp against the full board; drops clamp against the usable area

`boardGeometry()` now returns both `size` (board minus trash strip) and `fullSize` (the whole board).
`pointermove` clamps against `fullSize` so the note can visually enter the strip, while the drop
clamps against `size`, which produces the snap-back when the note is released away from the trash.
Resizing still clamps against `size`: growing a note into the strip would be ambiguous. Alternatives
considered: hit-testing the note rectangle against the trash (rejected — the pointer is the truthful
target, and it keeps the rule identical for tiny notes) and shrinking the strip into an overlay
(rejected — the strip is part of the board and must stay reachable).

### 3. Sync settles through one timer owned by the provider

`runSync` clears any pending idle timer when it starts, and schedules the transition `synced → idle`
after `SYNCED_TO_IDLE_MS` (1.5 s) on success. `retrySync` re-enters the same serialized `runSync`, so a
manual retry cannot race an in-flight save. All timers are cleared on unmount.

### 4. `clamp` prefers the minimum when the range inverts

`clamp(min > max)` previously returned `max`, i.e. the note shrank below its floor on a board smaller
than the minimum size. The guard returns `min`; a note may overflow such a board, which is preferable
to an unusable 20 px note.

## Risks / Trade-offs

- Undo restores a note with its old `zIndex`; if several notes were created in between, the restored
  note can appear below them. Accepted: preserving the original stacking is the honest restoration.
- The danger cue now depends on the pointer while the note is also visibly over the strip; a note
  grabbed near its bottom edge shows danger slightly before its body fully covers the strip.
- Six seconds is a guess, not a measured value; it is a named constant, easy to tune.
