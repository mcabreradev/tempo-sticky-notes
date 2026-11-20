# note-deletion Specification

## Purpose
Covers deleting notes by dragging them over a predefined on-screen trash zone — core feature #4 of the assessment.

## Requirements

### Requirement: Predefined trash zone

The UI SHALL present a fixed, clearly identifiable trash zone. The trash zone SHALL visually emphasize ("arm") whenever a note is being dragged, making its purpose discoverable at the exact moment it is usable.

#### Scenario: Trash zone arms during a note drag
- **WHEN** the user starts dragging any existing note
- **THEN** the trash zone becomes visually prominent (e.g., highlighted background and label)

### Requirement: Hover feedback over the trash zone

While dragging a note over the trash zone, both the trash zone and the dragged note SHALL give immediate danger feedback so the destructive outcome is unambiguous before release.

#### Scenario: Danger preview while hovering the trash
- **WHEN** the pointer (still holding the drag) enters the trash zone area
- **THEN** the trash zone switches to a danger state and the dragged note is visually marked for deletion

### Requirement: Drop to delete

Releasing a note drag while the pointer is inside the trash zone SHALL delete that note permanently and immediately.

#### Scenario: Release over trash deletes the note
- **WHEN** the user drops a note onto the armed trash zone
- **THEN** the note disappears from the board and from persisted state

#### Scenario: Drag out of the trash and release elsewhere keeps the note
- **WHEN** the user drags a note over the trash zone, moves back out, and releases on the board
- **THEN** the note remains on the board at its drop position

#### Scenario: Canceling the drag never deletes
- **WHEN** the user cancels the drag (Escape) while hovering the trash zone
- **THEN** the note is restored to its original position and is not deleted

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
