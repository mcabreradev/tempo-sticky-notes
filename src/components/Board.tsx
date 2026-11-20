import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useNotes } from '../app/notesContext'
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
import type { NoteId, Point, Rect } from '../domain/note'
import type { Note as NoteModel } from '../domain/note'
import { Note } from './Note'
import type { NoteDragVisual } from './Note'
import { Toolbar } from './Toolbar'
import { TrashZone, TRASH_ZONE_HEIGHT } from './TrashZone'

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
  const { state, dispatch, syncStatus, retrySync } = useNotes()
  const boardRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const [createPreview, setCreatePreview] = useState<Rect | null>(null)
  const [noteDrag, setNoteDrag] = useState<NoteDragInfo | null>(null)
  const [removedNote, setRemovedNote] = useState<NoteModel | null>(null)
  const [focusNoteId, setFocusNoteId] = useState<NoteId | null>(null)
  const { startDrag } = useDrag()

  // The undo offer is time-boxed: after a moment the deletion is final.
  useEffect(() => {
    if (!removedNote) {
      return
    }
    const timer = setTimeout(() => setRemovedNote(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [removedNote])

  // Board geometry is measured once per gesture: the viewport cannot change
  // mid-drag in a trustworthy way, and measuring per frame would thrash layout.
  const boardGeometry = () => {
    const rect = boardRef.current?.getBoundingClientRect() as DOMRect
    return {
      size: {
        width: rect.width,
        height: Math.max(0, rect.height - TRASH_ZONE_HEIGHT),
      },
      // Moves may travel across the whole board, trash strip included, so the
      // dragged note can visually reach the bin; drops snap back to `size`.
      fullSize: { width: rect.width, height: rect.height },
      origin: { x: rect.left, y: rect.top } as Point,
    }
  }

  const toBoardPoint = (origin: Point, client: Point): Point => ({
    x: client.x - origin.x,
    y: client.y - origin.y,
  })

  const trashRectOnBoard = (origin: Point): Rect => {
    const rect = trashRef.current?.getBoundingClientRect() as DOMRect
    return {
      x: rect.left - origin.x,
      y: rect.top - origin.y,
      width: rect.width,
      height: rect.height,
    }
  }

  const createNote = (rect: Rect) => {
    const note = makeNote(rect)
    dispatch({ type: 'create', note })
    setFocusNoteId(note.id)
  }

  const deleteNote = (note: NoteModel) => {
    setRemovedNote(note)
    dispatch({ type: 'delete', id: note.id })
  }

  // Keyboard parity: the same geometry rules the pointer gestures use.
  const nudgeNote = (note: NoteModel, deltaX: number, deltaY: number) => {
    const { size } = boardGeometry()
    dispatch({
      type: 'updateGeometry',
      id: note.id,
      rect: clampRectToBounds(
        { x: note.x + deltaX, y: note.y + deltaY, width: note.width, height: note.height },
        size,
      ),
    })
  }

  const nudgeResizeNote = (
    note: NoteModel,
    deltaWidth: number,
    deltaHeight: number,
  ) => {
    const { size } = boardGeometry()
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
  }

  const handleBoardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Only empty board space creates notes; children handle their own gestures.
    if (event.target !== event.currentTarget) {
      return
    }
    startDrag(event, (clientPoint) => {
      const { size, origin } = boardGeometry()
      const start = toBoardPoint(origin, clientPoint)
      let latestRect: Rect | null = null
      return {
        onMove: (deltaX, deltaY) => {
          const isClick =
            Math.abs(deltaX) <= CLICK_SLOP_PX &&
            Math.abs(deltaY) <= CLICK_SLOP_PX
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
        onCancel: () => {
          setCreatePreview(null)
        },
      }
    })
  }

  const addNoteFromToolbar = () => {
    const { size } = boardGeometry()
    createNote(findFreeSlot(Object.values(state.notes), size))
  }

  const startMove = (
    note: NoteModel,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    startDrag(event, () => {
      const { size, fullSize, origin } = boardGeometry()
      const trash = trashRectOnBoard(origin)
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
            { x: from.x + deltaX, y: from.y + deltaY, width: from.width, height: from.height },
            fullSize,
          )
          latestRect = rect
          dispatch({ type: 'updateGeometry', id: note.id, rect })
          setNoteDrag({
            id: note.id,
            visual: {
              overTrash: containsPoint(trash, toBoardPoint(origin, clientMovePoint)),
            },
          })
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
  }

  const startResize = (
    note: NoteModel,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    startDrag(event, () => {
      const { size } = boardGeometry()
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
        onEnd: () => {
          setNoteDrag(null)
        },
        onCancel: () => {
          setNoteDrag(null)
          dispatch({ type: 'updateGeometry', id: note.id, rect: from })
        },
      }
    })
  }

  // Keep notes usable across viewport changes: a smaller board never strands
  // a note outside the visible area.
  useEffect(() => {
    const handleResize = () => {
      const { size } = boardGeometry()
      for (const note of Object.values(state.notes)) {
        const clamped = clampRectToBounds(note, size)
        if (
          clamped.x !== note.x ||
          clamped.y !== note.y ||
          clamped.width !== note.width ||
          clamped.height !== note.height
        ) {
          dispatch({ type: 'updateGeometry', id: note.id, rect: clamped })
        }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [state.notes, dispatch])

  const notes = Object.values(state.notes).sort((a, b) => a.zIndex - b.zIndex)

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
        ref={boardRef}
        onPointerDown={handleBoardPointerDown}
      >
        {notes.map((note) => (
          <Note
            key={note.id}
            note={note}
            dragVisual={noteDrag?.id === note.id ? noteDrag.visual : null}
            autoFocus={note.id === focusNoteId}
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
          <div className="undo-toast" role="status" aria-live="polite">
            <span>Note deleted</span>
            <button
              type="button"
              className="undo-toast__action"
              onClick={() => {
                dispatch({ type: 'restore', note: removedNote })
                setFocusNoteId(removedNote.id)
                setRemovedNote(null)
              }}
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
