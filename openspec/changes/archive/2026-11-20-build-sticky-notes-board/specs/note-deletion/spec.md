# Spec Delta

## Purpose

Covers deleting notes by dragging them over a predefined on-screen trash zone — core feature #4 of the assessment.

## ADDED Requirements

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
