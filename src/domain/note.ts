export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface BoardSize {
  width: number
  height: number
}

export const NOTE_COLORS = [
  'yellow',
  'green',
  'blue',
  'pink',
  'purple',
  'orange',
] as const

export type NoteColor = (typeof NOTE_COLORS)[number]

export const DEFAULT_NOTE_COLOR: NoteColor = 'yellow'

export type NoteId = string

export interface Note extends Rect {
  id: NoteId
  text: string
  color: NoteColor
  zIndex: number
}

export const MIN_NOTE_WIDTH = 120
export const MIN_NOTE_HEIGHT = 60
export const DEFAULT_NOTE_WIDTH = 240
export const DEFAULT_NOTE_HEIGHT = 160

export function clamp(value: number, min: number, max: number): number {
  // A board can be smaller than the minimum note size; in that case the
  // minimum wins so a note never collapses below its floor.
  if (min > max) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

export function normalizeRect(from: Point, to: Point): Rect {
  const x = Math.min(from.x, to.x)
  const y = Math.min(from.y, to.y)
  return {
    x,
    y,
    width: Math.max(MIN_NOTE_WIDTH, Math.abs(to.x - from.x)),
    height: Math.max(MIN_NOTE_HEIGHT, Math.abs(to.y - from.y)),
  }
}

export function clampRectToBounds(rect: Rect, bounds: BoardSize): Rect {
  const width = Math.min(rect.width, bounds.width)
  const height = Math.min(rect.height, bounds.height)
  return {
    x: clamp(rect.x, 0, bounds.width - width),
    y: clamp(rect.y, 0, bounds.height - height),
    width,
    height,
  }
}

export function containsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

const CASCADE_ORIGIN = 64
const CASCADE_STEP = 32
const CASCADE_STEPS = 8

// Cascade placement scans "staircase" slots (down-right by CASCADE_STEP) so
// repeated presses of "New note" stay visible and stop stacking exactly on
// top of each other.
export function findFreeSlot(notes: Array<Rect>, bounds: BoardSize): Rect {
  const base: Rect = {
    x: 0,
    y: 0,
    width: Math.min(DEFAULT_NOTE_WIDTH, bounds.width),
    height: Math.min(DEFAULT_NOTE_HEIGHT, bounds.height),
  }
  for (let step = 0; step < CASCADE_STEPS; step += 1) {
    const candidate = clampRectToBounds(
      {
        ...base,
        x: CASCADE_ORIGIN + step * CASCADE_STEP,
        y: CASCADE_ORIGIN + step * CASCADE_STEP,
      },
      bounds,
    )
    if (!notes.some((note) => rectsIntersect(note, candidate))) {
      return candidate
    }
  }
  return clampRectToBounds(
    { ...base, x: CASCADE_ORIGIN, y: CASCADE_ORIGIN },
    bounds,
  )
}
