import type { BoardSize, Point, Rect } from '../domain/note'

export interface BoardGeometry {
  /** Usable drawing area: the board minus the trash strip. */
  size: BoardSize
  /** Whole board, trash strip included: a dragged note may travel here. */
  fullSize: BoardSize
  /** The board's top-left corner in client (viewport) coordinates. */
  origin: Point
  /** The trash strip, in board coordinates. */
  trash: Rect
}

export const EMPTY_GEOMETRY: BoardGeometry = {
  size: { width: 0, height: 0 },
  fullSize: { width: 0, height: 0 },
  origin: { x: 0, y: 0 },
  trash: { x: 0, y: 0, width: 0, height: 0 },
}

// Measured once per gesture: the geometry is read from the DOM instead of being
// kept in a constant, so the CSS stays the single source of truth and hit
// testing cannot drift away from what is on screen.
export function measureBoard(
  boardEl: HTMLElement | null,
  trashEl: HTMLElement | null,
): BoardGeometry {
  if (!boardEl) {
    return EMPTY_GEOMETRY
  }
  const board = boardEl.getBoundingClientRect()
  const trashRect = trashEl?.getBoundingClientRect()
  const trash: Rect = trashRect
    ? {
        x: trashRect.left - board.left,
        y: trashRect.top - board.top,
        width: trashRect.width,
        height: trashRect.height,
      }
    : { x: 0, y: board.height, width: board.width, height: 0 }

  return {
    size: {
      width: board.width,
      height: Math.max(0, Math.min(board.height, trash.y)),
    },
    fullSize: { width: board.width, height: board.height },
    origin: { x: board.left, y: board.top },
    trash,
  }
}

export function toBoardPoint(origin: Point, client: Point): Point {
  return { x: client.x - origin.x, y: client.y - origin.y }
}
