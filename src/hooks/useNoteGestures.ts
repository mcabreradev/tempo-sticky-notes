import { useCallback, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { toBoardPoint } from '../app/boardGeometry'
import type { BoardGeometry } from '../app/boardGeometry'
import type { BoardAction } from '../app/store'
import {
  clamp,
  clampRectToBounds,
  containsPoint,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  normalizeRect,
} from '../domain/note'
import type { Note as NoteModel, NoteId, Rect } from '../domain/note'
import { useDrag } from './useDrag'

// Below this travel the gesture is a click, not a draw.
const CLICK_SLOP_PX = 4

export interface NoteDragVisual {
  overTrash: boolean
}

export interface NoteDragInfo {
  id: NoteId
  visual: NoteDragVisual
}

interface NoteGesturesOptions {
  measure: () => BoardGeometry
  dispatch: (action: BoardAction) => void
  onCreate: (rect: Rect) => void
  onDelete: (note: NoteModel) => void
}

export interface NoteGestures {
  createPreview: Rect | null
  noteDrag: NoteDragInfo | null
  handleBoardPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  startMove: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
  startResize: (note: NoteModel, event: ReactPointerEvent<HTMLElement>) => void
}

// The three required gestures (create, move, resize) are one engine with three
// session factories. They live here so the board component only composes: it
// owns the store, the undo offer and the focus, not the pointer arithmetic.
export function useNoteGestures({
  measure,
  dispatch,
  onCreate,
  onDelete,
}: NoteGesturesOptions): NoteGestures {
  const { startDrag } = useDrag()
  const [createPreview, setCreatePreview] = useState<Rect | null>(null)
  const [noteDrag, setNoteDrag] = useState<NoteDragInfo | null>(null)

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
            onCreate(rect)
          },
          onCancel: () => setCreatePreview(null),
        }
      })
    },
    [measure, onCreate, startDrag],
  )

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
            // frame would re-render for a visual state already on screen.
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
              onDelete(note)
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
    [dispatch, measure, onDelete, startDrag],
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

  return {
    createPreview,
    noteDrag,
    handleBoardPointerDown,
    startMove,
    startResize,
  }
}
