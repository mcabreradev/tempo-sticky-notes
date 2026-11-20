import { describe, expect, it } from 'vitest'
import type { Note } from '../domain/note'
import { boardReducer, initialBoardState } from './store'

function baseNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    x: 10,
    y: 10,
    width: 240,
    height: 160,
    text: '',
    color: 'yellow',
    zIndex: 0,
    ...overrides,
  }
}

describe('boardReducer', () => {
  it('creates a note and pushes it to the front', () => {
    const state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    expect(state.notes.n1).toEqual({ ...baseNote(), zIndex: 1 })
    expect(state.zCounter).toBe(1)
  })

  it('creates later notes above earlier ones', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    state = boardReducer(state, {
      type: 'create',
      note: baseNote({ id: 'n2', x: 50, y: 50 }),
    })
    expect(state.notes.n1.zIndex).toBe(1)
    expect(state.notes.n2.zIndex).toBe(2)
  })

  it('updates note geometry', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    state = boardReducer(state, {
      type: 'updateGeometry',
      id: 'n1',
      rect: { x: 300, y: 200, width: 320, height: 90 },
    })
    expect(state.notes.n1).toMatchObject({
      x: 300,
      y: 200,
      width: 320,
      height: 90,
    })
  })

  it('edits note text', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    state = boardReducer(state, {
      type: 'setText',
      id: 'n1',
      text: 'Buy milk',
    })
    expect(state.notes.n1.text).toBe('Buy milk')
  })

  it('changes note color', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    state = boardReducer(state, { type: 'setColor', id: 'n1', color: 'green' })
    expect(state.notes.n1.color).toBe('green')
  })

  it('brings a note to the front monotonically', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    state = boardReducer(state, {
      type: 'create',
      note: baseNote({ id: 'n2' }),
    })
    state = boardReducer(state, { type: 'bringToFront', id: 'n1' })
    expect(state.notes.n1.zIndex).toBe(3)
    expect(state.notes.n2.zIndex).toBe(2)
    state = boardReducer(state, { type: 'bringToFront', id: 'n1' })
    expect(state.notes.n1.zIndex).toBe(4)
  })

  it('deletes notes', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    state = boardReducer(state, { type: 'delete', id: 'n1' })
    expect(state.notes.n1).toBeUndefined()
  })

  it('restores a deleted note with its original geometry and stacking', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    state = boardReducer(state, {
      type: 'create',
      note: baseNote({ id: 'n2' }),
    })
    const snapshot = state.notes.n1
    state = boardReducer(state, { type: 'delete', id: 'n1' })
    state = boardReducer(state, { type: 'restore', note: snapshot })
    expect(state.notes.n1).toEqual(snapshot)
    expect(state.notes.n1.zIndex).toBe(1)
    expect(state.zCounter).toBe(2)
  })

  it('keeps the z counter monotonic when restoring a stale note', () => {
    let state = boardReducer(initialBoardState, {
      type: 'create',
      note: baseNote(),
    })
    const snapshot = state.notes.n1
    state = boardReducer(state, { type: 'delete', id: 'n1' })
    state = boardReducer(state, { type: 'create', note: baseNote({ id: 'n2' }) })
    state = boardReducer(state, { type: 'restore', note: snapshot })
    expect(state.zCounter).toBe(2)
    expect(boardReducer(state, { type: 'create', note: baseNote({ id: 'n3' }) }).zCounter).toBe(3)
  })

  it('hydrates from a restored note list keeping stacking order', () => {
    const notes = [
      baseNote({ id: 'a', zIndex: 2 }),
      baseNote({ id: 'b', zIndex: 5 }),
    ]
    const state = boardReducer(initialBoardState, { type: 'hydrate', notes })
    expect(Object.keys(state.notes)).toHaveLength(2)
    expect(state.zCounter).toBe(5)
    // A brand new note after hydration must land above every restored note.
    const next = boardReducer(state, { type: 'create', note: baseNote({ id: 'c' }) })
    expect(next.notes.c.zIndex).toBe(6)
  })

  it('ignores actions targeting unknown notes', () => {
    const state = boardReducer(initialBoardState, {
      type: 'updateGeometry',
      id: 'nope',
      rect: { x: 0, y: 0, width: 10, height: 10 },
    })
    expect(state).toBe(initialBoardState)
  })
})
