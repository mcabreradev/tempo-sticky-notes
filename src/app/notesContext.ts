import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { BoardAction, BoardState } from './store'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export interface NotesContextValue {
  state: BoardState
  dispatch: Dispatch<BoardAction>
  syncStatus: SyncStatus
  retrySync: () => void
}

export const NotesContext = createContext<NotesContextValue | null>(null)

export function useNotes(): NotesContextValue {
  const value = useContext(NotesContext)
  if (!value) {
    throw new Error('useNotes must be used inside <NotesProvider>')
  }
  return value
}
