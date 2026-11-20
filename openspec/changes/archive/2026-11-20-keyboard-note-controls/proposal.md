# Proposal

## Why

The board could only be operated with a pointer: notes were not focusable, so a keyboard user could
not select, move, resize, edit or delete a note at all. The assessment asks for a usable desktop
application, and keyboard access is the remaining usability gap identified after the interaction
polish round.

## What Changes

- Notes become focusable elements (`role="group"`, `tabIndex=0`) with an accessible label built from
  their text.
- Arrow keys move the focused note by 8 px; `Shift` + arrows resize it by 8 px.
- `Enter` / `F2` starts text editing and `Escape` leaves it, returning focus to the note.
- `Delete` / `Backspace` deletes the focused note through the same path as the trash drop, so the
  existing undo window applies.
- Creating a note from the toolbar moves focus into the new note; restoring a deleted note focuses it.
- Focus is visible on the note itself and on its controls.

## Capabilities

### New Capabilities

- `keyboard-controls`: keyboard operation of notes (focus, move, resize, edit, delete, focus
  management) equivalent to the pointer gestures.

### Modified Capabilities

(none — the pointer behaviours are unchanged)

## Impact

- **Code**: `components/Note.tsx` (focusability, keyboard map, focus return after editing),
  `components/Board.tsx` (nudge/resize/delete handlers, focus tracking), `index.css` (focus ring),
  `README.md` (keyboard section and verification).
- **Tests**: +7 UI tests (focusability and tab order, arrows, clamping, Shift+arrows, Delete + undo,
  Enter/Escape, focus after toolbar creation) → 88 total.
- **Dependencies**: none.
