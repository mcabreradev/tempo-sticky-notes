import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BoardDispatchContext, BoardStateContext, SyncContext } from './notesContext'
import type { SyncStatus } from './notesContext'
import { boardReducer, initialBoardState } from './store'
import { loadBoard, saveBoard } from '../infra/persistence'
import { MockRestNotesApi } from '../infra/mockApi'
import type { NotesApi } from '../infra/mockApi'
import type { Note } from '../domain/note'

const PERSIST_DEBOUNCE_MS = 150
const SYNC_DEBOUNCE_MS = 400
const SYNCED_TO_IDLE_MS = 1500

// Sync is serialized (one in-flight save at a time) and always sends the
// latest snapshot: rapid edits coalesce instead of racing each other.
export function NotesProvider({
  children,
  api,
}: {
  children: ReactNode
  api?: NotesApi
}) {
  // Chosen once, at mount: the API is a composition-time dependency, not
  // something that should be rebuilt to satisfy a render.
  const [restApi] = useState<NotesApi>(() => api ?? new MockRestNotesApi())
  // localStorage read happens in the lazy initializer: it is synchronous and
  // side-effect free, so hydration needs no effect (and survives StrictMode's
  // double-invocation harmlessly). loadBoard never throws, not even when the
  // storage accessor itself is blocked.
  const [state, dispatch] = useReducer(boardReducer, initialBoardState, (initial) => {
    const restored = loadBoard()
    return restored ? boardReducer(initial, { type: 'hydrate', notes: restored }) : initial
  })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  const queuedRef = useRef<Note[] | null>(null)
  const inFlightRef = useRef(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearIdleTimer = useCallback((): void => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const startNextSave = useCallback(
    function startNextSave(): void {
      if (inFlightRef.current) {
        return
      }
      const snapshot = queuedRef.current
      if (!snapshot) {
        return
      }
      queuedRef.current = null
      inFlightRef.current = true
      clearIdleTimer()
      setSyncStatus('syncing')
      restApi
        .saveAll(snapshot)
        .then(() => {
          setSyncStatus('synced')
          idleTimerRef.current = setTimeout(() => {
            setSyncStatus('idle')
            idleTimerRef.current = null
          }, SYNCED_TO_IDLE_MS)
        })
        .catch(() => {
          setSyncStatus('error')
        })
        .finally(() => {
          inFlightRef.current = false
          // A change arrived while this save was in flight: send the newest
          // snapshot next, in order.
          startNextSave()
        })
    },
    [restApi, clearIdleTimer],
  )

  const requestSync = useCallback(
    (notes: Note[]): void => {
      queuedRef.current = notes
      startNextSave()
    },
    [startNextSave],
  )

  // Persistence is derived from state, not fired from a dispatch wrapper: an
  // action the reducer ignores (or one that changes nothing) writes nothing.
  useEffect(() => {
    const timer = setTimeout(() => saveBoard(state), PERSIST_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state])

  // Same idea for the async mirror. `lastSyncedState` starts as the hydrated
  // state, so loading the board does not trigger a pointless save; StrictMode's
  // double effect also lands on the same reference and stays quiet.
  const lastSyncedStateRef = useRef(state)
  useEffect(() => {
    if (lastSyncedStateRef.current === state) {
      return
    }
    const snapshot = state
    const timer = setTimeout(() => {
      lastSyncedStateRef.current = snapshot
      requestSync(Object.values(snapshot.notes))
    }, SYNC_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state, requestSync])

  useEffect(() => {
    return () => {
      clearIdleTimer()
    }
  }, [clearIdleTimer])

  const retrySync = useCallback((): void => {
    requestSync(Object.values(state.notes))
  }, [requestSync, state.notes])

  const syncValue = useMemo(
    () => ({ status: syncStatus, retry: retrySync }),
    [syncStatus, retrySync],
  )

  return (
    <BoardDispatchContext.Provider value={dispatch}>
      <BoardStateContext.Provider value={state}>
        <SyncContext.Provider value={syncValue}>{children}</SyncContext.Provider>
      </BoardStateContext.Provider>
    </BoardDispatchContext.Provider>
  )
}
