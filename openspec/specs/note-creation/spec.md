# note-creation Specification

## Purpose
Covers how the user creates sticky notes on the board with full control over their position and size, which is core feature #1 of the assessment.

## Requirements

### Requirement: Create a note by drawing on the empty board

When the user presses the primary pointer button on an empty area of the board and drags, a rectangular preview SHALL follow the pointer. When the drag is released, a new note SHALL be created at exactly the previewed position and size, expressed in board coordinates (CSS pixels relative to the board's top-left corner).

#### Scenario: Drag-draw creates a note with the drawn geometry
- **WHEN** the user presses on an empty board area at (200, 150) and drags to (440, 270) before releasing
- **THEN** a new note exists with its top-left corner at (200, 150) and a size of 240×120

#### Scenario: Release position is independent of scroll or window origin
- **WHEN** the board is scrolled or the window offset changes during the session
- **THEN** the created note still lands exactly under the pointer, because all geometry is computed in board coordinates

### Requirement: Minimum note size enforcement

A note SHALL never be created smaller than the minimum size of 120×60 CSS pixels. A drawn rectangle smaller than the minimum SHALL be clamped to it.

#### Scenario: Tiny drag still creates a usable note
- **WHEN** the user drags a 8×5 rectangle and releases
- **THEN** a note of 120×60 is created, anchored at the drag start point

### Requirement: Creation stays inside the board

Notes SHALL be fully contained within the board's bounds at creation.

#### Scenario: Rectangle drawn beyond the board edges
- **WHEN** the drawn rectangle overflows the right or bottom board edge
- **THEN** the created note is clamped so it remains fully visible inside the board

### Requirement: Click and button fallbacks

The interaction SHALL offer two fallbacks: clicking (press + release without meaningful movement) on empty board space SHALL create a default-sized note (240×160) centered on the click point and clamped to the board; clicking the "New note" toolbar action SHALL create a default-sized note at the next free cascading position.

#### Scenario: Simple click creates a default note
- **WHEN** the user clicks on empty board space without dragging
- **THEN** a 240×160 note appears centered under the click point

#### Scenario: Toolbar button always creates a note without pointer drawing
- **WHEN** the user activates the "New note" button
- **THEN** a note of default size appears at a visible, non-overlapping position

### Requirement: New note initial state

A newly created note SHALL use the default color, empty text, and SHALL be brought to the front above any overlapping notes.

#### Scenario: New note renders above existing ones
- **WHEN** a note is created where other notes already exist
- **THEN** the new note visually overlaps the existing notes
