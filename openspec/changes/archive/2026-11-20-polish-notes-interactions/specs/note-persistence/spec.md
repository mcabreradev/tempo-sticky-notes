# Spec Delta

## ADDED Requirements

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
