import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Point } from '../domain/note'

// A DragSession is the callbacks of one in-flight gesture. The caller
// captures the geometry snapshot it needs in onDragStart's closure, which
// keeps cancel exact by construction.
export interface DragSession {
  onMove: (
    deltaX: number,
    deltaY: number,
    point: Point,
    event: PointerEvent,
  ) => void
  onEnd: (point: Point) => void
  onCancel: () => void
}

export type DragStarter = (point: Point) => DragSession | null

interface ActiveDrag {
  pointerId: number
  origin: Point
  session: DragSession
}

export function useDrag(): {
  startDrag: (
    event: ReactPointerEvent<HTMLElement>,
    onDragStart: DragStarter,
  ) => void
} {
  const activeRef = useRef<ActiveDrag | null>(null)

  const startDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>, onDragStart: DragStarter) => {
      if (event.button !== 0 || !event.isPrimary || activeRef.current) {
        return
      }
      const origin: Point = { x: event.clientX, y: event.clientY }
      const session = onDragStart(origin)
      if (!session) {
        return
      }
      const target = event.currentTarget
      const pointerId = event.pointerId
      target.setPointerCapture(pointerId)
      activeRef.current = { pointerId, origin, session }

      const cleanup = () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
        window.removeEventListener('pointercancel', handlePointerCancel)
        window.removeEventListener('keydown', handleKeyDown, true)
        if (target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId)
        }
        activeRef.current = null
      }

      const handleMove = (move: PointerEvent) => {
        if (move.pointerId !== pointerId) {
          return
        }
        session.onMove(
          move.clientX - origin.x,
          move.clientY - origin.y,
          { x: move.clientX, y: move.clientY },
          move,
        )
      }
      const handleUp = (up: PointerEvent) => {
        if (up.pointerId !== pointerId) {
          return
        }
        cleanup()
        session.onEnd({ x: up.clientX, y: up.clientY })
      }
      const handlePointerCancel = (cancel: PointerEvent) => {
        if (cancel.pointerId !== pointerId) {
          return
        }
        cleanup()
        session.onCancel()
      }
      const handleKeyDown = (key: KeyboardEvent) => {
        if (key.key !== 'Escape') {
          return
        }
        key.preventDefault()
        cleanup()
        session.onCancel()
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      window.addEventListener('pointercancel', handlePointerCancel)
      window.addEventListener('keydown', handleKeyDown, true)
    },
    [],
  )

  // Cancel gracefully if the component unmounts mid-drag (e.g., the dragged
  // note gets deleted externally).
  useEffect(() => {
    return () => {
      activeRef.current?.session.onCancel()
      activeRef.current = null
    }
  }, [])

  return { startDrag }
}
