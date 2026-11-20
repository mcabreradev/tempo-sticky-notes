# Spec Delta

## MODIFIED Requirements

### Requirement: Tolerate unavailable or invalid stored data

If stored data is missing, malformed, from an incompatible schema version, or storage access throws
(e.g., disabled storage), the application SHALL start with an empty board and SHALL NOT crash or
corrupt the UI. Storage access that throws **when the storage object itself is obtained** SHALL be
treated the same way, because that access happens during the first render.

#### Scenario: Corrupt payload is ignored
- **WHEN** the local storage payload cannot be parsed or fails validation
- **THEN** the application starts empty and logs the issue to the console

#### Scenario: Storage throws during save
- **WHEN** writing to local storage throws (quota or restricted mode)
- **THEN** the board keeps working in memory and no error surfaces to the user beyond a console warning

#### Scenario: Storage access itself is blocked
- **WHEN** obtaining the storage object throws (private mode, blocked third-party storage)
- **THEN** the board renders empty and stays usable, and a console warning is logged

## ADDED Requirements

### Requirement: Reject persisted notes below the domain minimum

Persisted notes whose stored size is below the board's minimum note size SHALL be rejected as
invalid, because such a note could not be resized or reached once rendered.

#### Scenario: Too-small persisted note is ignored
- **WHEN** a stored payload contains a note narrower than the minimum width or shorter than the minimum height
- **THEN** the payload is treated as invalid and the board starts empty
