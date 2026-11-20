# Spec Delta

## MODIFIED Requirements

### Requirement: Interacting with a note brings it to front

When the user presses a pointer on a note — on any part of it, including its colour swatches and its
resize handle — that note's stacking order SHALL rise above every other note. The stacking order
SHALL be stable and deterministic (monotonic), and SHALL be preserved by the persistence capability.
Raising the note that is already on top SHALL not change the board state at all.

#### Scenario: Overlapping notes re-stack on press
- **WHEN** two notes overlap and the user presses on the one rendered below
- **THEN** the pressed note is rendered above the other

#### Scenario: Raising the top note is a no-op
- **WHEN** the user presses the note that is already in front
- **THEN** nothing about the board changes — no reorder, no write, no sync

#### Scenario: A control press also raises the note
- **WHEN** the user presses a note's colour swatch or its resize handle
- **THEN** the note comes forward before the control acts

## ADDED Requirements

### Requirement: Notes stay inside the board when the viewport changes

When the board shrinks, every note SHALL be clamped back inside the visible area in a single board
update, so no note is stranded off-screen.

#### Scenario: Shrinking the window pulls notes back in
- **WHEN** the window becomes smaller than the area a note occupies
- **THEN** every note is moved and resized to fit inside the new usable area

### Requirement: Board geometry follows the rendered strip

The usable drawing area SHALL be derived from the rendered position of the trash strip instead of a
duplicated constant, so the geometry used for hit testing always matches what is on screen.

#### Scenario: The strip height is defined once
- **WHEN** the strip's height changes in the stylesheet
- **THEN** note placement, clamping and trash hit testing follow it without a code change
