# note-manipulation Specification

## Purpose
Covers how existing notes are moved by dragging, resized by dragging, and layered when overlapping — core features #2 and #3 of the assessment plus optional feature II (bring to front).

## Requirements

### Requirement: Move a note by dragging

Pressing the primary pointer button on a note (outside its resize handle and, while editing, outside its text editor) and moving the pointer SHALL move the note, preserving the original grab-point offset. The move SHALL use pointer capture so that fast movements and movements outside the note element (or outside the browser viewport) keep updating the note until release.

#### Scenario: Drag follows the pointer with offset preserved
- **WHEN** the user presses 30px from a note's left edge and moves the pointer 100px right and 40px down
- **THEN** the note's left edge moves exactly 100px right and 40px down

#### Scenario: Drag continues outside the element and viewport
- **WHEN** the pointer leaves the note element and even the browser window borders while dragging
- **THEN** the note keeps following the pointer until the button is released

#### Scenario: Drag is clamped to the board
- **WHEN** the user drags a note towards the board edges
- **THEN** the note never ends outside the visible board area

#### Scenario: Escape cancels the move
- **WHEN** the user presses Escape during a move drag
- **THEN** the note returns to the exact position it had before the drag started

### Requirement: Resize a note by dragging

A note SHALL expose a resize affordance in its bottom-right corner. Dragging that handle SHALL resize the note, while its top-left corner remains fixed. The result SHALL respect the minimum size (120×60) and remain fully inside the board.

#### Scenario: Resize from the corner handle
- **WHEN** the user drags the bottom-right handle 60px right and 30px down
- **THEN** the note is 60px wider and 30px taller, with its top-left corner unchanged

#### Scenario: Resize respects minimums
- **WHEN** the user drags the handle upwards/leftwards beyond the minimum size
- **THEN** the note stops shrinking at 120×60

#### Scenario: Escape cancels the resize
- **WHEN** the user presses Escape during a resize drag
- **THEN** the note returns to the size it had before the drag started

### Requirement: Interacting with a note brings it to front

When the user presses a pointer on a note, that note's stacking order SHALL rise above every other note. The stacking order SHALL be stable and deterministic (monotonic), and SHALL be preserved by the persistence capability.

#### Scenario: Overlapping notes re-stack on press
- **WHEN** two notes overlap and the user presses on the one rendered below
- **THEN** the pressed note is rendered above the other
