# Spec Delta

## ADDED Requirements

### Requirement: Undo window after deleting with the trash zone

After a note is deleted by dropping it on the trash zone, the interface SHALL offer an "Undo" action
for a short, visible window. Undoing SHALL restore the note with the exact geometry, text, color and
stacking order it had before the deletion. Once the window closes, the deletion is final.

#### Scenario: Undo restores the deleted note exactly
- **WHEN** the user deletes a note that had text and a custom color, and then activates "Undo"
- **THEN** the note reappears with the same position, size, text, color and stacking order

#### Scenario: The offer expires
- **WHEN** the user does nothing for longer than the undo window
- **THEN** the undo offer disappears and the note stays deleted

#### Scenario: Restoring keeps the stacking counter consistent
- **WHEN** a restored note is later joined by a newly created note
- **THEN** the new note still renders above every existing note

### Requirement: Dragged notes enter the trash strip

While a note is being dragged, it SHALL be allowed to travel into the trash strip so the destructive
target is physically reachable. If the note is released outside the trash zone, it SHALL snap back
inside the area above the strip.

#### Scenario: The note reaches the bin
- **WHEN** the user drags a note down to the trash strip
- **THEN** the note is rendered over the strip and both show the danger state

#### Scenario: Releasing next to the strip snaps the note back
- **WHEN** the user releases the note inside the strip area but not over the trash zone
- **THEN** the note is placed back fully above the strip and is not deleted
