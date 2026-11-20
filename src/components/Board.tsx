import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { measureBoard, toBoardPoint } from '../app/boardGeometry'
import { useBoardDispatch, useBoardState, useSync } from '../app/notesContext'
import { useDrag } from '../hooks/useDrag'
import {
  clamp,
  clampRectToBounds,
  containsPoint,
  DEFAULT_NOTE_COLOR,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  findFreeSlot,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  normalizeRect,
} from '../domain/note'
import type { NoteId, Rect } from '../domain/note'
import type { Note as NoteModel } from '../domain/note'
import { Note } from './Note'
import type { NoteDragVisual } from './Note'
import { Toolbar } from './Toolbar'
import { TrashZone } from './TrashZone'

// Below this travel the gesture is a click, not a draw.
const CLICK_SLOP_PX = 4
const UNDO_WINDOW_MS = 6000

interface NoteDragInfo {
  id: NoteId
  visual: NoteDragVisual
}

function makeNote(rect: Rect): NoteModel {
  return {
    id: crypto.randomUUID(),
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    text: '',
    color: DEFAULT_NOTE_COLOR,
    zIndex: 0, // the reducer replaces this with the next z value
  }
}

export function Board() {
  const state = useBoardState()
  const dispatch = useBoardDispatch()
  const { status: syncStatus, retry: retrySync } = useSync()
  const boardRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const [createPreview, setCreatePreview] = useState<Rect | null>(null)
  const [noteDrag, setNoteDrag] = useState<NoteDragInfo | null>(null)
  const [removedNote, setRemovedNote] = useState<NoteModel | null>(null)
  const [undoPaused, setUndoPaused] = useState(false)
  const [focusNoteId, setFocusNoteId] = useState<NoteId | null>(null)
  const { startDrag } = useDrag()

  const notes = useMemo(
    () => Object.values(state.notes).sort((a, b) => a.zIndex - b.zIndex),
    [state.notes],
  )
  // Newest notes without rebuilding the handlers around them: a handler that
  // changes identity on every edit would defeat memo() on every note.
  const notesRef = useRef(notes)
  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  // Geometry is measured, not derived from a constant: the trash strip is the
  // element itself, so CSS stays the single source of truth.
  const measure = useCallback(
    () => measureBoard(boardRef.current, trashRef.current),
    [],
  )

  // The undo offer is time-boxed, and pauses while the user is on it (keyboard
  // focus included) so a time limit cannot swallow the action.
  useEffect(() => {
    if (!removedNote || undoPaused) {
      return
    }
    const timer = setTimeout(() => setRemovedNote(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [removedNote, undoPaused])

  const handleFocusHandled = useCallback(() => {
    setFocusNoteId(null)
  }, [])

  const createNote = useCallback(
    (rect: Rect) => {
      const note = makeNote(rect)
      dispatch({ type: 'create', note })
      setFocusNoteId(note.id)
    },
    [dispatch],
  )

  const deleteNote = useCallback(
    (note: NoteModel) => {
      setRemovedNote(note)
      setUndoPaused(false)
      // Focus is about to be destroyed with the element: hand it to the
      // neighbour that takes its place instead of dropping the caret on <body>.
      const ordered = notesRef.current
      const index = ordered.findIndex((candidate) => candidate.id === note.id)
      const next = ordered[index + 1] ?? ordered[index - 1] ?? null
      dispatch({ type: 'delete', id: note.id })
      setFocusNoteId(next ? next.id : null)
    },
    [dispatch],
  )

  // Keyboard parity: the same geometry rules the pointer gestures use.
  const nudgeNote = useCallback(
    (note: NoteModel, deltaX: number, deltaY: number) => {
      const { size } = measure()
      dispatch({
        type: 'updateGeometry',
        id: note.id,
        rect: clampRectToBounds(
          {
            x: note.x + deltaX,
            y: note.y + deltaY,
            width: note.width,
            height: note.height,
          },
          size,
        ),
      })
    },
    [dispatch, measure],
  )

  const nudgeResizeNote = useCallback(
    (note: NoteModel, deltaWidth: number, deltaHeight: number) => {
      const { size } = measure()
      dispatch({
        type: 'updateGeometry',
        id: note.id,
        rect: {
          x: note.x,
          y: note.y,
          width: clamp(note.width + deltaWidth, MIN_NOTE_WIDTH, size.width - note.x),
          height: clamp(note.height + deltaHeight, MIN_NOTE_HEIGHT, size.height - note.y),
        },
      })
    },
    [dispatch, measure],
  )

  const handleBoardPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      // Only empty board space creates notes; children handle their own gestures.
      if (event.target !== event.currentTarget) {
        return
      }
      startDrag(event, (clientPoint) => {
        const { size, origin } = measure()
        const start = toBoardPoint(origin, clientPoint)
        let latestRect: Rect | null = null
        return {
          onMove: (deltaX, deltaY) => {
            const isClick =
              Math.abs(deltaX) <= CLICK_SLOP_PX && Math.abs(deltaY) <= CLICK_SLOP_PX
            if (isClick) {
              return
            }
            const rect = clampRectToBounds(
              normalizeRect(start, { x: start.x + deltaX, y: start.y + deltaY }),
              size,
            )
            latestRect = rect
            setCreatePreview(rect)
          },
          onEnd: () => {
            setCreatePreview(null)
            const rect =
              latestRect ??
              clampRectToBounds(
                {
                  x: start.x - DEFAULT_NOTE_WIDTH / 2,
                  y: start.y - DEFAULT_NOTE_HEIGHT / 2,
                  width: DEFAULT_NOTE_WIDTH,
                  height: DEFAULT_NOTE_HEIGHT,
                },
                size,
              )
            createNote(rect)
          },
          onCancel: () => setCreatePreview(null),
        }
      })
    },
    [createNote, measure, startDrag],
  )

  const addNoteFromToolbar = useCallback(() => {
    const { size } = measure()
    createNote(findFreeSlot(notesRef.current, size))
  }, [createNote, measure])

  const startMove = useCallback(
    (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => {
      startDrag(event, () => {
        const { size, fullSize, origin, trash } = measure()
        const from: Rect = {
          x: note.x,
          y: note.y,
          width: note.width,
          height: note.height,
        }
        let latestRect: Rect | null = null
        setNoteDrag({ id: note.id, visual: { overTrash: false } })
        return {
          onMove: (deltaX, deltaY, clientMovePoint) => {
            const rect = clampRectToBounds(
              {
                x: from.x + deltaX,
                y: from.y + deltaY,
                width: from.width,
                height: from.height,
              },
              fullSize,
            )
            latestRect = rect
            dispatch({ type: 'updateGeometry', id: note.id, rect })
            const overTrash = containsPoint(
              trash,
              toBoardPoint(origin, clientMovePoint),
            )
            // Reuse the previous object when nothing changed: a new object per
            // frame would re-render for a visual state that is already on screen.
            setNoteDrag((current) =>
              current && current.visual.overTrash === overTrash
                ? current
                : { id: note.id, visual: { overTrash } },
            )
          },
          onEnd: (clientEndPoint) => {
            setNoteDrag(null)
            const overTrash = containsPoint(
              trash,
              toBoardPoint(origin, clientEndPoint),
            )
            if (overTrash) {
              deleteNote(note)
              return
            }
            if (latestRect) {
              dispatch({
                type: 'updateGeometry',
                id: note.id,
                rect: clampRectToBounds(latestRect, size),
              })
            }
          },
          onCancel: () => {
            setNoteDrag(null)
            dispatch({ type: 'updateGeometry', id: note.id, rect: from })
          },
        }
      })
    },
    [deleteNote, dispatch, measure, startDrag],
  )

  const startResize = useCallback(
    (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => {
      startDrag(event, () => {
        const { size } = measure()
        const from: Rect = {
          x: note.x,
          y: note.y,
          width: note.width,
          height: note.height,
        }
        setNoteDrag({ id: note.id, visual: { overTrash: false } })
        return {
          onMove: (deltaX, deltaY) => {
            // The top-left corner is anchored: resize clamps size only, so
            // clampRectToBounds cannot be used here.
            const rect: Rect = {
              x: from.x,
              y: from.y,
              width: clamp(from.width + deltaX, MIN_NOTE_WIDTH, size.width - from.x),
              height: clamp(
                from.height + deltaY,
                MIN_NOTE_HEIGHT,
                size.height - from.y,
              ),
            }
            dispatch({ type: 'updateGeometry', id: note.id, rect })
          },
          onEnd: () => setNoteDrag(null),
          onCancel: () => {
            setNoteDrag(null)
            dispatch({ type: 'updateGeometry', id: note.id, rect: from })
          },
        }
      })
    },
    [dispatch, measure, startDrag],
  )

  // Keep notes usable across viewport changes: a smaller board never strands a
  // note outside the visible area. One action for the whole board, and a
  // listener registered once instead of once per edit.
  useEffect(() => {
    const handleResize = () => {
      dispatch({ type: 'clampAll', size: measure().size })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dispatch, measure])

  const handleUndo = useCallback(() => {
    if (!removedNote) {
      return
    }
    dispatch({ type: 'restore', note: removedNote })
    setFocusNoteId(removedNote.id)
    setRemovedNote(null)
    setUndoPaused(false)
  }, [dispatch, removedNote])

  return (
    <div className="app">
      <Toolbar
        noteCount={notes.length}
        syncStatus={syncStatus}
        onNewNote={addNoteFromToolbar}
        onRetrySync={retrySync}
      />
      <div
        className="board"
        data-testid="board"
        ref={boardRef}
        role="region"
        aria-label="Cork board"
        onPointerDown={handleBoardPointerDown}
      >
        {notes.map((note) => (
          <Note
            key={note.id}
            note={note}
            dragVisual={noteDrag?.id === note.id ? noteDrag.visual : null}
            focusOnMount={note.id === focusNoteId}
            onFocusHandled={handleFocusHandled}
            onStartMove={startMove}
            onStartResize={startResize}
            onNudge={nudgeNote}
            onNudgeResize={nudgeResizeNote}
            onDelete={deleteNote}
          />
        ))}
        {createPreview && (
          <div
            className="board__preview"
            data-testid="board-preview"
            style={{
              left: createPreview.x,
              top: createPreview.y,
              width: createPreview.width,
              height: createPreview.height,
            }}
            aria-hidden
          />
        )}
        {removedNote && (
          <div
            className="undo-toast"
            data-testid="undo-toast"
            role="status"
            onMouseEnter={() => setUndoPaused(true)}
            onMouseLeave={() => setUndoPaused(false)}
            onFocus={() => setUndoPaused(true)}
            onBlur={() => setUndoPaused(false)}
          >
            <span>Note deleted. Undo?</span>
            <button
              type="button"
              className="undo-toast__action"
              data-testid="undo-action"
              onClick={handleUndo}
            >
              Undo
            </button>
          </div>
        )}
        <TrashZone
          ref={trashRef}
          active={noteDrag !== null}
          danger={noteDrag?.visual.overTrash ?? false}
        />
      </div>
    </div>
  )
}
