# Spec Delta

## Purpose

Covers full keyboard operation of the board, so every note action available to a pointer is also
available without one.

## ADDED Requirements

### Requirement: Notes are focusable and announced

Each note SHALL be reachable with the keyboard (`Tab` / `Shift+Tab`) in stacking order, SHALL expose
itself as a named group to assistive technology, and SHALL show a visible focus indicator while
focused.

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
as a trash drop, so the undo offer applies.

#### Scenario: Enter edits, Escape reverts
- **WHEN** the user presses Enter on a focused note, types, then presses Escape
- **THEN** the editor closes, the original text is kept and the note regains focus

#### Scenario: Delete is undoable from the keyboard
- **WHEN** the user presses Delete on a focused note
- **THEN** the note disappears and an undo action is offered that restores it

### Requirement: Focus follows creation and restoration

Creating a note from the toolbar SHALL move keyboard focus into the new note, and undoing a deletion
SHALL move focus to the restored note.

#### Scenario: New note takes focus
- **WHEN** the user activates "+ New note" with the keyboard
- **THEN** the new note is the focused element
