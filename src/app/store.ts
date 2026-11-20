import { clampRectToBounds } from '../domain/note'
import type { BoardSize, Note, NoteColor, NoteId, Rect } from '../domain/note'

export interface BoardState {
  notes: Record<NoteId, Note>
  // Monotonic counter so stacking never depends on iteration order.
  zCounter: number
}

const EMPTY_NOTES: Record<NoteId, Note> = Object.freeze({})

// Frozen: a shared mutable initial value handed to the reducer is an accident
// waiting to happen.
export const initialBoardState: BoardState = Object.freeze({
  notes: EMPTY_NOTES,
  zCounter: 0,
})

export type BoardAction =
  | { type: 'create'; note: Note }
  | { type: 'updateGeometry'; id: NoteId; rect: Rect }
  | { type: 'setText'; id: NoteId; text: string }
  | { type: 'setColor'; id: NoteId; color: NoteColor }
  | { type: 'bringToFront'; id: NoteId }
  | { type: 'delete'; id: NoteId }
  | { type: 'restore'; note: Note }
  | { type: 'hydrate'; notes: Note[] }
  | { type: 'clampAll'; size: BoardSize }

function patchNote(state: BoardState, id: NoteId, patch: Partial<Note>): BoardState {
  const note = state.notes[id]
  if (!note) {
    return state
  }
  return { ...state, notes: { ...state.notes, [id]: { ...note, ...patch } } }
}

function toFrontNote(note: Note, zIndex: number): Note {
  return { ...note, zIndex }
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'create': {
      const zCounter = state.zCounter + 1
      return {
        notes: {
          ...state.notes,
          [action.note.id]: toFrontNote(action.note, zCounter),
        },
        zCounter,
      }
    }
    case 'updateGeometry': {
      const note = state.notes[action.id]
      if (!note) {
        return state
      }
      const { x, y, width, height } = action.rect
      // Pointer moves that resolve to the same geometry must not create a new
      // state object: no re-render, no persistence write, no sync.
      if (note.x === x && note.y === y && note.width === width && note.height === height) {
        return state
      }
      return patchNote(state, action.id, { x, y, width, height })
    }
    case 'setText':
      return patchNote(state, action.id, { text: action.text })
    case 'setColor':
      return patchNote(state, action.id, { color: action.color })
    case 'bringToFront': {
      const note = state.notes[action.id]
      // Raising the note that is already on top changes nothing: returning the
      // same state keeps persistence and sync effects quiet during plain
      // clicks, and leaves every other note untouched.
      if (!note || note.zIndex === state.zCounter) {
        return state
      }
      const zCounter = state.zCounter + 1
      return {
        notes: { ...state.notes, [action.id]: toFrontNote(note, zCounter) },
        zCounter,
      }
    }
    case 'delete': {
      if (!state.notes[action.id]) {
        return state
      }
      const notes = { ...state.notes }
      delete notes[action.id]
      return { ...state, notes }
    }
    case 'restore': {
      // Restoring over a live note would be a silent data loss.
      if (state.notes[action.note.id]) {
        return state
      }
      return {
        notes: { ...state.notes, [action.note.id]: action.note },
        zCounter: Math.max(state.zCounter, action.note.zIndex),
      }
    }
    case 'hydrate': {
      const notes: Record<NoteId, Note> = {}
      // Duplicate ids in a hand-edited payload collapse to the last one instead
      // of double-counting.
      for (const note of action.notes) {
        notes[note.id] = note
      }
      let zCounter = 0
      for (const note of Object.values(notes)) {
        zCounter = Math.max(zCounter, note.zIndex)
      }
      return { notes, zCounter }
    }
    case 'clampAll': {
      const notes: Record<NoteId, Note> = {}
      let changed = false
      for (const note of Object.values(state.notes)) {
        const clamped = clampRectToBounds(note, action.size)
        if (
          clamped.x !== note.x ||
          clamped.y !== note.y ||
          clamped.width !== note.width ||
          clamped.height !== note.height
        ) {
          changed = true
          notes[note.id] = { ...note, ...clamped }
        } else {
          notes[note.id] = note
        }
      }
      return changed ? { ...state, notes } : state
    }
  }
}
