# Proposal

## Why

Reviewing the delivered board in real browsers surfaced five usability defects that the automated
suite could not feel: deleting a note is irreversible, the dragged note is clamped outside the trash
strip (so the danger cue is visually disconnected from the note), the sync indicator never settles
back and a failed sync has no recovery path, long note text is clipped with no way to read it, and an
inverted clamp range can shrink a note below its minimum on a very small board.

## What Changes

- Deletions made with the trash zone become reversible for a short window through an "Undo" action.
- A dragged note may travel across the whole board, strip included, so it visually reaches the trash;
  releasing outside the trash snaps it back above the strip.
- The sync status settles back to idle after a successful sync, and a failed sync exposes a manual
  retry.
- Note text scrolls inside the note instead of being clipped.
- `clamp` keeps the minimum when the range is inverted, so notes never collapse below their floor on
  tiny viewports.
- README and the verification record document the new behaviour and the Firefox run.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `note-deletion`: adds the undo window after a drop, and the ability for a dragged note to enter the
  trash strip visually.
- `note-persistence`: adds the settling sync status and the manual retry after a failure.
- `note-content`: long text scrolls inside the note.

## Impact

- **Code**: `components/Board.tsx` (undo state and toast, move clamp split into full/usable size),
  `app/store.ts` (`restore` action), `app/NotesProvider.tsx` + `app/notesContext.ts` (retry and
  idle settling), `components/Toolbar.tsx` (labels, retry button), `domain/note.ts` (`clamp` guard),
  `index.css` (toast, retry button, scrollable body), `README.md`.
- **Tests**: +9 tests (store restore ×2, undo UI ×2, trash-strip entry ×2, sync settling ×2, clamp
  guard ×1) → 81 total.
- **Dependencies**: none added.
