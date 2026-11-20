import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { BoardAction, BoardState } from './store'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

export interface SyncContextValue {
  status: SyncStatus
  retry: () => void
}

// Three contexts instead of one value object: `dispatch` never changes, so a
// leaf that only dispatches (like <Note>) must not re-render every time the
// board state does. Splitting is what makes that possible — a single object
// with `state` inside forces every consumer to subscribe to every change.
export const BoardStateContext = createContext<BoardState | null>(null)
export const BoardDispatchContext = createContext<Dispatch<BoardAction> | null>(null)
export const SyncContext = createContext<SyncContextValue | null>(null)

export function useBoardState(): BoardState {
  const value = useContext(BoardStateContext)
  if (!value) {
    throw new Error('useBoardState must be used inside <NotesProvider>')
  }
  return value
}

export function useBoardDispatch(): Dispatch<BoardAction> {
  const value = useContext(BoardDispatchContext)
  if (!value) {
    throw new Error('useBoardDispatch must be used inside <NotesProvider>')
  }
  return value
}

export function useSync(): SyncContextValue {
  const value = useContext(SyncContext)
  if (!value) {
    throw new Error('useSync must be used inside <NotesProvider>')
  }
  return value
}
