# note-persistence Specification

## Purpose
Covers the optional features III (save to localStorage, restore on load) and V (save to a REST API via an asynchronous mock), implemented per the client's stated priority order.

## Requirements

### Requirement: Restore notes from local storage on load

Every board change SHALL be saved to the browser's local storage (debounced), and opening the application SHALL restore the previously saved notes, including their positions, sizes, text, colors, and stacking order.

#### Scenario: Reload restores the board
- **WHEN** the user creates, moves, resizes, recolors and edits notes, then reloads the page
- **THEN** the board loads with exactly the same notes and layout

### Requirement: Tolerate unavailable or invalid stored data

If stored data is missing, malformed, from an incompatible schema version, or storage access throws (e.g., disabled storage), the application SHALL start with an empty board and SHALL NOT crash or corrupt the UI.

#### Scenario: Corrupt payload is ignored
- **WHEN** the local storage payload cannot be parsed or fails validation
- **THEN** the application starts empty and logs the issue to the console

#### Scenario: Storage throws during save
- **WHEN** writing to local storage throws (quota or restricted mode)
- **THEN** the board keeps working in memory and no error surfaces to the user beyond a console warning

### Requirement: Asynchronous REST API mock sync

Notes SHALL also be saved through a REST-like boundary whose operations are asynchronous (simulated network latency), as required by the assessment. The UI SHALL expose the sync status (idle, syncing, synced, error). A failing mock call SHALL surface an error state without interrupting local editing or local storage persistence.

#### Scenario: Sync round-trip is asynchronous and observable
- **WHEN** a note change triggers a sync
- **THEN** the status transitions to "syncing" and later to "synced", with the remote call resolving after a real delay rather than synchronously

#### Scenario: Mock failure is handled
- **WHEN** the mock API rejects
- **THEN** the status shows "error", the board remains fully usable, and local persistence is unaffected

### Requirement: Sync status settles back to idle

After a successful sync the interface SHALL show the success state briefly and then return to its
idle state, so a stale success indicator never implies an in-flight operation.

#### Scenario: Success state is transient
- **WHEN** a change syncs successfully and the user makes no further changes
- **THEN** the status shows "Synced" and then settles to the idle "Saved locally" state

### Requirement: Manual retry after a failed sync

When a sync attempt fails, the interface SHALL expose a control that retries the sync immediately,
using the latest notes on the board.

#### Scenario: Retry recovers from a failure
- **WHEN** a sync fails and the user activates "Retry"
- **THEN** a new sync runs, the status reflects its outcome, and the failure state is cleared on
  success
