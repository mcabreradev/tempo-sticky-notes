# Spec Delta

## MODIFIED Requirements

### Requirement: Undo window after deleting with the trash zone

After a note is deleted by dropping it on the trash zone, the interface SHALL offer an "Undo" action
for a short, visible window. Undoing SHALL restore the note with the exact geometry, text, color and
stacking order it had before the deletion. Once the window closes, the deletion is final. The window
SHALL pause while the user is on the offer (pointer hover or keyboard focus), so the time limit
cannot take the action away from someone already reaching for it.

#### Scenario: Undo restores the deleted note exactly
- **WHEN** the user deletes a note that had text and a custom color, and then activates "Undo"
- **THEN** the note reappears with the same position, size, text, color and stacking order

#### Scenario: The offer expires
- **WHEN** the user does nothing for longer than the undo window
- **THEN** the undo offer disappears and the note stays deleted

#### Scenario: Restoring keeps the stacking counter consistent
- **WHEN** a restored note is later joined by a newly created note
- **THEN** the new note still renders above every existing note

#### Scenario: The window waits for the user
- **WHEN** the toast is hovered or focused
- **THEN** the countdown does not expire it
