import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { boardReducer, initialBoardState } from './store'
import type { BoardAction } from './store'
import { NotesContext } from './notesContext'
import type { SyncStatus } from './notesContext'
import { loadBoard, saveBoard } from '../infra/persistence'
import { MockRestNotesApi } from '../infra/mockApi'
import type { NotesApi } from '../infra/mockApi'

const PERSIST_DEBOUNCE_MS = 150
const SYNC_DEBOUNCE_MS = 400

// Sync is serialized (one in-flight save at a time) and always sends the
// latest snapshot: rapid edits coalesce instead of racing each other.
export function NotesProvider({
  children,
  api,
}: {
  children: ReactNode
  api?: NotesApi
}) {
  const restApi = useMemo(() => api ?? new MockRestNotesApi(), [api])
  // localStorage read happens in the lazy initializer: it is synchronous and
  // side-effect free, so hydration needs no effect (and survives StrictMode's
  // double-invocation harmlessly).
  const [state, baseDispatch] = useReducer(
    boardReducer,
    initialBoardState,
    (initial) => {
      const restored = loadBoard()
      return restored
        ? boardReducer(initial, { type: 'hydrate', notes: restored })
        : initial
    },
  )
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  const stateRef = useRef(state)
  const inFlightRef = useRef(false)
  const pendingRef = useRef(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runSyncRef = useRef<() => void>(() => {})

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const timer = setTimeout(() => saveBoard(state), PERSIST_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [state])

  const runSync = useCallback((): void => {
    if (inFlightRef.current) {
      pendingRef.current = true
      return
    }
    inFlightRef.current = true
    setSyncStatus('syncing')
    const snapshot = Object.values(stateRef.current.notes)
    restApi
      .saveAll(snapshot)
      .then(() => setSyncStatus('synced'))
      .catch(() => setSyncStatus('error'))
      .finally(() => {
        inFlightRef.current = false
        if (pendingRef.current) {
          pendingRef.current = false
          runSyncRef.current()
        }
      })
  }, [restApi])

  useEffect(() => {
    runSyncRef.current = runSync
  }, [runSync])

  const dispatch = useCallback(
    (action: BoardAction) => {
      baseDispatch(action)
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
      syncTimerRef.current = setTimeout(runSync, SYNC_DEBOUNCE_MS)
    },
    [runSync],
  )

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [])

  const value = useMemo(
    () => ({ state, dispatch, syncStatus }),
    [state, dispatch, syncStatus],
  )

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}
