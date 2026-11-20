import type { Note, NoteColor, NoteId, Rect } from '../domain/note'

export interface BoardState {
  notes: Record<NoteId, Note>
  // Monotonic counter so stacking never depends on iteration order.
  zCounter: number
}

export const initialBoardState: BoardState = { notes: {}, zCounter: 0 }

export type BoardAction =
  | { type: 'create'; note: Note }
  | { type: 'updateGeometry'; id: NoteId; rect: Rect }
  | { type: 'setText'; id: NoteId; text: string }
  | { type: 'setColor'; id: NoteId; color: NoteColor }
  | { type: 'bringToFront'; id: NoteId }
  | { type: 'delete'; id: NoteId }
  | { type: 'restore'; note: Note }
  | { type: 'hydrate'; notes: Note[] }

function patchNote(
  state: BoardState,
  id: NoteId,
  patch: Partial<Note>,
): BoardState {
  const note = state.notes[id]
  if (!note) {
    return state
  }
  return { ...state, notes: { ...state.notes, [id]: { ...note, ...patch } } }
}

function toFrontNote(note: Note, zIndex: number): Note {
  return { ...note, zIndex }
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
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
    case 'updateGeometry':
      return patchNote(state, action.id, { ...action.rect })
    case 'setText':
      return patchNote(state, action.id, { text: action.text })
    case 'setColor':
      return patchNote(state, action.id, { color: action.color })
    case 'bringToFront': {
      const note = state.notes[action.id]
      if (!note) {
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
      return {
        notes: { ...state.notes, [action.note.id]: action.note },
        zCounter: Math.max(state.zCounter, action.note.zIndex),
      }
    }
    case 'hydrate': {
      const notes: Record<NoteId, Note> = {}
      let zCounter = 0
      for (const note of action.notes) {
        notes[note.id] = note
        zCounter = Math.max(zCounter, note.zIndex)
      }
      return { notes, zCounter }
    }
  }
}
