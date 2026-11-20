# keyboard-controls Specification

## Purpose
Covers full keyboard operation of the board, so every note action available to a pointer is also
available without one.

## Requirements

### Requirement: Notes are focusable and announced

Each note SHALL be reachable with the keyboard (`Tab` / `Shift+Tab`) in stacking order, SHALL expose
itself as a named group to assistive technology, SHALL describe what kind of object it is together
with the keyboard shortcuts it supports, and SHALL show a visible focus indicator while focused.

#### Scenario: Tabbing reaches every note
- **WHEN** the user presses Tab from the toolbar
- **THEN** focus moves through the notes in stacking order and each focused note is visibly outlined

#### Scenario: A note carries a label
- **WHEN** a note contains text
- **THEN** its accessible name includes the beginning of that text, and an empty note is announced as
  an empty note

### Requirement: Move and resize with the keyboard

Arrow keys SHALL move the focused note by 8 px on the corresponding axis, and `Shift` + arrow keys
SHALL change its width or height by 8 px. Both SHALL respect the existing board containment, minimum
size and maximum extent rules.

#### Scenario: Arrow keys move the note
- **WHEN** the focused note is at (64, 64) and the user presses ArrowRight twice then ArrowDown
- **THEN** the note is at (80, 72)

#### Scenario: Shift+arrows resize the note
- **WHEN** the focused 240×160 note receives Shift+ArrowRight then Shift+ArrowDown
- **THEN** the note is 248×168 with its top-left corner unchanged

#### Scenario: Keyboard movement cannot escape the board
- **WHEN** the user keeps pressing ArrowLeft and ArrowUp
- **THEN** the note stops at the board edges

### Requirement: Edit and delete with the keyboard

`Enter` or `F2` SHALL open the note's editor; `Escape` SHALL close it, discard unsaved changes and
return focus to the note. `Delete` or `Backspace` SHALL delete the focused note through the same path
as a trash drop, so the undo offer applies. After such a deletion, focus SHALL move to the
neighbouring note instead of being lost.

#### Scenario: Enter edits, Escape reverts
- **WHEN** the user presses Enter on a focused note, types, then presses Escape
- **THEN** the editor closes, the original text is kept and the note regains focus

#### Scenario: Delete is undoable from the keyboard
- **WHEN** the user presses Delete on a focused note
- **THEN** the note disappears and an undo action is offered that restores it

#### Scenario: Focus survives deletion
- **WHEN** the user deletes a focused note with the keyboard
- **THEN** focus lands on the note that took its place, or on the previous neighbour when it was last

### Requirement: Focus follows creation and restoration

Creating a note from the toolbar SHALL move keyboard focus into the new note, and undoing a deletion
SHALL move focus to the restored note.

#### Scenario: New note takes focus
- **WHEN** the user activates "+ New note" with the keyboard
- **THEN** the new note is the focused element

### Requirement: The colour palette behaves as a radio group

The swatches SHALL behave as a radio group: exactly one swatch is in the tab order (the selected
one), and the arrow keys move the selection and the focus together.

#### Scenario: One tab stop for the palette
- **WHEN** the user tabs from a note into its palette
- **THEN** the selected swatch receives focus and the other swatches are not separate tab stops

#### Scenario: Arrows change the colour
- **WHEN** a swatch has focus and the user presses an arrow key
- **THEN** the next swatch in that direction becomes selected and focused
