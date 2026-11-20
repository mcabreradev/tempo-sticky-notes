# Spec Delta

## ADDED Requirements

### Requirement: Long note text remains reachable

Text longer than the note body SHALL scroll inside the note instead of being clipped, both while
editing and while reading.

#### Scenario: Overflowing text scrolls
- **WHEN** a note's text exceeds the body height
- **THEN** the body scrolls vertically and the text can be read without resizing the note
