# Spec Delta

## MODIFIED Requirements

### Requirement: Edit note text

Double-clicking a note's body SHALL open an inline text editor with the current text preselected. The
edited text SHALL be saved when the editor loses focus, when the user presses Cmd/Ctrl+Enter, and
SHALL be discarded when the user presses Escape. Editing SHALL remain fully functional after a
cancelled edit: a discarded draft SHALL never disable a later save.

#### Scenario: Double-click opens editing with existing text
- **WHEN** the user double-clicks a note containing "Buy milk"
- **THEN** an editable field appears with "Buy milk" selected, and pointer drags inside the editor do not move the note

#### Scenario: Blur and Cmd/Ctrl+Enter save the text
- **WHEN** the user edits the text and clicks elsewhere or presses Cmd/Ctrl+Enter
- **THEN** the note displays the new text

#### Scenario: Escape discards the edit
- **WHEN** the user edits the text and presses Escape
- **THEN** the note keeps the text it had before editing started

#### Scenario: Empty text stays valid
- **WHEN** the user clears all text and saves
- **THEN** the note renders an empty state placeholder instead of failing

#### Scenario: A cancelled edit does not poison the next one
- **WHEN** the user cancels one edit with Escape, then edits the same note again and saves
- **THEN** the second edit is saved normally
