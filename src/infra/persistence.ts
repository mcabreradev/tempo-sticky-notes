import { NOTE_COLORS } from '../domain/note'
import type { Note } from '../domain/note'
import type { BoardState } from '../app/store'

export const BOARD_STORAGE_KEY = 'sticky-notes-board-v1'

interface PersistedBoardV1 {
  version: 1
  notes: Note[]
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStoredNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    isFiniteNumber(candidate.x) &&
    isFiniteNumber(candidate.y) &&
    isFiniteNumber(candidate.width) &&
    isFiniteNumber(candidate.height) &&
    candidate.width >= 0 &&
    candidate.height >= 0 &&
    typeof candidate.text === 'string' &&
    typeof candidate.color === 'string' &&
    (NOTE_COLORS as readonly string[]).includes(candidate.color) &&
    isFiniteNumber(candidate.zIndex) &&
    Number.isInteger(candidate.zIndex)
  )
}

export function serializeBoard(state: BoardState): string {
  const payload: PersistedBoardV1 = {
    version: 1,
    notes: Object.values(state.notes),
  }
  return JSON.stringify(payload)
}

// parseBoard is deliberately defensive: persisted state is external input,
// so every field is validated instead of trusting the shape.
export function parseBoard(raw: string): Note[] | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) {
    return null
  }
  const payload = data as { version?: unknown; notes?: unknown }
  if (payload.version !== 1 || !Array.isArray(payload.notes)) {
    return null
  }
  if (!payload.notes.every(isStoredNote)) {
    return null
  }
  return payload.notes
}

export function loadBoard(storage: Storage = window.localStorage): Note[] | null {
  try {
    const raw = storage.getItem(BOARD_STORAGE_KEY)
    if (raw === null) {
      return null
    }
    const notes = parseBoard(raw)
    if (notes === null) {
      console.warn('[persistence] stored board payload is invalid; starting empty')
    }
    return notes
  } catch (error) {
    console.warn('[persistence] reading the board failed:', error)
    return null
  }
}

export function saveBoard(
  state: BoardState,
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(BOARD_STORAGE_KEY, serializeBoard(state))
  } catch (error) {
    console.warn('[persistence] saving the board failed:', error)
  }
}
