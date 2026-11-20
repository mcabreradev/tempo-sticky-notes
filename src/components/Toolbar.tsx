import type { SyncStatus } from '../app/notesContext'

interface ToolbarProps {
  noteCount: number
  syncStatus: SyncStatus
  onNewNote: () => void
  onRetrySync: () => void
}

const STATUS_LABEL: Record<SyncStatus, string> = {
  idle: 'Saved locally',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync failed',
}

export function Toolbar({
  noteCount,
  syncStatus,
  onNewNote,
  onRetrySync,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <h1>Sticky Notes</h1>
        <p className="toolbar__hint">Drag on the cork board to create a note</p>
      </div>
      <button type="button" className="toolbar__new" onClick={onNewNote}>
        + New note
      </button>
      <div className={`sync sync--${syncStatus}`} aria-live="polite">
        <span className="sync__dot" aria-hidden />
        <span>{STATUS_LABEL[syncStatus]}</span>
        {syncStatus === 'error' && (
          <button type="button" className="sync__retry" onClick={onRetrySync}>
            Retry
          </button>
        )}
        <span className="sync__count">
          {noteCount} {noteCount === 1 ? 'note' : 'notes'}
        </span>
      </div>
    </header>
  )
}
