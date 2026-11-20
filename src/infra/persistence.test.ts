import { describe, expect, it, vi } from 'vitest'
import type { Note } from '../domain/note'
import type { BoardState } from '../app/store'
import {
  loadBoard,
  parseBoard,
  saveBoard,
  serializeBoard,
} from './persistence'

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    x: 10,
    y: 20,
    width: 240,
    height: 160,
    text: 'hello',
    color: 'green',
    zIndex: 3,
    ...overrides,
  }
}

function stateWith(notes: Note[]): BoardState {
  return { notes: Object.fromEntries(notes.map((n) => [n.id, n])), zCounter: 9 }
}

function throwingStorage(): Storage {
  return {
    get length(): number {
      throw new Error('denied')
    },
    clear: () => {
      throw new Error('denied')
    },
    getItem: () => {
      throw new Error('denied')
    },
    key: () => {
      throw new Error('denied')
    },
    removeItem: () => {
      throw new Error('denied')
    },
    setItem: () => {
      throw new Error('denied')
    },
  }
}

describe('serializeBoard + parseBoard', () => {
  it('round-trips a valid board', () => {
    const notes = [note(), note({ id: 'n2', text: '', color: 'yellow' })]
    const restored = parseBoard(serializeBoard(stateWith(notes)))
    expect(restored).toEqual(notes)
  })

  it('rejects malformed JSON', () => {
    expect(parseBoard('{not json')).toBeNull()
  })

  it('rejects a wrong schema version', () => {
    expect(parseBoard(JSON.stringify({ version: 99, notes: [] }))).toBeNull()
  })

  it('rejects notes with invalid colors', () => {
    const payload = JSON.stringify({
      version: 1,
      notes: [{ ...note(), color: 'neon' }],
    })
    expect(parseBoard(payload)).toBeNull()
  })

  it('rejects notes with non-finite geometry', () => {
    const payload = JSON.stringify({
      version: 1,
      notes: [{ ...note(), x: NaN }],
    })
    expect(parseBoard(payload)).toBeNull()
  })

  it('rejects notes with missing fields', () => {
    const payload = JSON.stringify({
      version: 1,
      notes: [{ id: 'n1', x: 10 }],
    })
    expect(parseBoard(payload)).toBeNull()
  })
})

describe('loadBoard / saveBoard', () => {
  it('returns null when nothing was saved', () => {
    window.localStorage.clear()
    expect(loadBoard()).toBeNull()
  })

  it('restores what was saved', () => {
    const notes = [note()]
    saveBoard(stateWith(notes))
    expect(loadBoard()).toEqual(notes)
  })

  it('does not throw when storage writes are denied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() =>
      saveBoard(stateWith([note()]), throwingStorage()),
    ).not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('returns null and warns when storage reads are denied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(loadBoard(throwingStorage())).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
