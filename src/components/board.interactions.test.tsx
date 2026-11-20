import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotesProvider } from '../app/NotesProvider'
import { Board } from './Board'
import { BOARD_STORAGE_KEY } from '../infra/persistence'
import { MockRestNotesApi } from '../infra/mockApi'

function pointer(type: string, init: PointerEventInit = {}): PointerEvent {
  return new window.PointerEvent(type, {
    bubbles: true,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
    ...init,
  })
}

function mockLayoutRects() {
  const empty = {
    x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0,
    toJSON: () => ({}),
  } as DOMRect
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement): DOMRect {
      if (this.classList.contains('board')) {
        return { ...empty, width: 1024, height: 640, right: 1024, bottom: 640 }
      }
      if (this.classList.contains('trash')) {
        return {
          ...empty, y: 568, top: 568, height: 72, bottom: 640,
          width: 1024, right: 1024,
        }
      }
      return empty
    },
  )
}

function renderBoard(api = new MockRestNotesApi({ minDelayMs: 5, maxDelayMs: 5 })) {
  return render(
    <NotesProvider api={api}>
      <Board />
    </NotesProvider>,
  )
}

function boardEl(): HTMLElement {
  return document.querySelector('.board') as HTMLElement
}

function noteEls(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.note'))
}

function onlyNote(): HTMLElement {
  const notes = noteEls()
  expect(notes).toHaveLength(1)
  return notes[0] as HTMLElement
}

function createViaButton(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: /new note/i }))
  const notes = noteEls()
  return notes[notes.length - 1] as HTMLElement
}

function dragElement(
  el: HTMLElement,
  from: { x: number; y: number },
  moves: Array<{ x: number; y: number }>,
  options: { release?: boolean } = {},
) {
  fireEvent(el, pointer('pointerdown', { clientX: from.x, clientY: from.y }))
  for (const point of moves) {
    fireEvent(window, pointer('pointermove', { clientX: point.x, clientY: point.y }))
  }
  if (options.release !== false) {
    const last = moves[moves.length - 1] ?? from
    fireEvent(window, pointer('pointerup', { clientX: last.x, clientY: last.y }))
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  mockLayoutRects()
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('note creation', () => {
  it('creates a note with the drawn geometry via drag-to-create', () => {
    renderBoard()
    fireEvent(boardEl(), pointer('pointerdown', { clientX: 100, clientY: 100 }))
    fireEvent(window, pointer('pointermove', { clientX: 340, clientY: 260 }))
    expect(document.querySelector('.board__preview')).not.toBeNull()
    fireEvent(window, pointer('pointerup', { clientX: 340, clientY: 260 }))

    const note = onlyNote()
    expect(note.style.left).toBe('100px')
    expect(note.style.top).toBe('100px')
    expect(note.style.width).toBe('240px')
    expect(note.style.height).toBe('160px')
    expect(document.querySelector('.board__preview')).toBeNull()
  })

  it('creates a default-sized note centered on a plain click', () => {
    renderBoard()
    fireEvent(boardEl(), pointer('pointerdown', { clientX: 300, clientY: 200 }))
    fireEvent(window, pointer('pointerup', { clientX: 300, clientY: 200 }))

    const note = onlyNote()
    expect(note.style.left).toBe('180px')
    expect(note.style.top).toBe('120px')
    expect(note.style.width).toBe('240px')
    expect(note.style.height).toBe('160px')
  })

  it('enforces the minimum size on tiny drags', () => {
    renderBoard()
    fireEvent(boardEl(), pointer('pointerdown', { clientX: 400, clientY: 300 }))
    fireEvent(window, pointer('pointermove', { clientX: 405, clientY: 303 }))
    fireEvent(window, pointer('pointerup', { clientX: 405, clientY: 303 }))

    const note = onlyNote()
    expect(note.style.left).toBe('400px')
    expect(note.style.top).toBe('300px')
    expect(note.style.width).toBe('120px')
    expect(note.style.height).toBe('60px')
  })

  it('clamps creation to the board edges', () => {
    renderBoard()
    fireEvent(boardEl(), pointer('pointerdown', { clientX: 900, clientY: 500 }))
    fireEvent(window, pointer('pointermove', { clientX: 1600, clientY: 900 }))
    fireEvent(window, pointer('pointerup', { clientX: 1600, clientY: 900 }))

    const note = onlyNote()
    // Board size is 1024x640 minus the 72px trash strip → 1024x568 usable.
    // Drawn rect is (900,500)+(700x400) → clamped to stay fully inside:
    expect(note.style.left).toBe('324px')
    expect(note.style.top).toBe('168px')
    expect(note.style.width).toBe('700px')
    expect(note.style.height).toBe('400px')
    const left = Number.parseInt(note.style.left)
    const top = Number.parseInt(note.style.top)
    const width = Number.parseInt(note.style.width)
    const height = Number.parseInt(note.style.height)
    expect(left + width).toBeLessThanOrEqual(1024)
    expect(top + height).toBeLessThanOrEqual(568)
  })

  it('creates a note at a cascading slot from the toolbar button', () => {
    renderBoard()
    const note = createViaButton()
    expect(note.style.left).toBe('64px')
    expect(note.style.top).toBe('64px')
  })

  it('does not create extra notes when dragging an existing one', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement
    dragElement(body, { x: 74, y: 74 }, [{ x: 90, y: 90 }])
    expect(noteEls()).toHaveLength(1)
  })
})

describe('moving notes', () => {
  it('moves a note following the pointer, preserving the grab offset', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement

    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 274, clientY: 214 }))
    expect(note.classList).toContain('note--dragging')
    fireEvent(window, pointer('pointerup', { clientX: 274, clientY: 214 }))

    expect(note.style.left).toBe('264px')
    expect(note.style.top).toBe('204px')
    expect(note.classList).not.toContain('note--dragging')
  })

  it('clamps the move to the board edges', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement
    dragElement(body, { x: 74, y: 74 }, [{ x: -300, y: -300 }])
    expect(note.style.left).toBe('0px')
    expect(note.style.top).toBe('0px')
  })

  it('cancels the move with Escape, restoring the original position', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement

    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 274, clientY: 214 }))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent(window, pointer('pointermove', { clientX: 400, clientY: 400 }))
    fireEvent(window, pointer('pointerup', { clientX: 400, clientY: 400 }))

    expect(note.style.left).toBe('64px')
    expect(note.style.top).toBe('64px')
  })
})

describe('resizing notes', () => {
  it('resizes a note via its corner handle, anchoring the top-left corner', () => {
    renderBoard()
    const note = createViaButton()
    const handle = note.querySelector('.note__resize') as HTMLElement
    dragElement(handle, { x: 304, y: 224 }, [{ x: 364, y: 254 }])

    expect(note.style.left).toBe('64px')
    expect(note.style.top).toBe('64px')
    expect(note.style.width).toBe('300px')
    expect(note.style.height).toBe('190px')
  })

  it('respects the minimum size when shrinking', () => {
    renderBoard()
    const note = createViaButton()
    const handle = note.querySelector('.note__resize') as HTMLElement
    dragElement(handle, { x: 304, y: 224 }, [{ x: -200, y: -200 }])

    expect(note.style.width).toBe('120px')
    expect(note.style.height).toBe('60px')
  })

  it('cancels the resize with Escape, restoring the size', () => {
    renderBoard()
    const note = createViaButton()
    const handle = note.querySelector('.note__resize') as HTMLElement

    fireEvent(handle, pointer('pointerdown', { clientX: 304, clientY: 224 }))
    fireEvent(window, pointer('pointermove', { clientX: 394, clientY: 284 }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(note.style.width).toBe('240px')
    expect(note.style.height).toBe('160px')
  })
})

describe('trash zone deletion', () => {
  it('deletes a note dropped over the armed trash zone', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement

    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 400, clientY: 600 }))
    expect(document.querySelector('.trash')?.classList).toContain('trash--danger')
    expect(note.classList).toContain('note--danger')
    fireEvent(window, pointer('pointerup', { clientX: 400, clientY: 600 }))

    expect(noteEls()).toHaveLength(0)
  })

  it('keeps the note when dragged out of the trash before release', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement

    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 400, clientY: 600 }))
    fireEvent(window, pointer('pointermove', { clientX: 300, clientY: 200 }))
    fireEvent(window, pointer('pointerup', { clientX: 300, clientY: 200 }))

    expect(noteEls()).toHaveLength(1)
    expect(note.style.left).toBe('290px')
    expect(note.style.top).toBe('190px')
    expect(note.classList).not.toContain('note--danger')
  })

  it('never deletes when the drag is canceled over the trash', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement

    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 400, clientY: 600 }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(noteEls()).toHaveLength(1)
    expect(note.style.left).toBe('64px')
    expect(note.style.top).toBe('64px')
  })
})

describe('undo after deletion', () => {
  it('offers an undo that restores the deleted note exactly', () => {
    renderBoard()
    const note = createViaButton()
    // Give it some content so restoration is meaningful.
    const body = note.querySelector('.note__body') as HTMLElement
    fireEvent.doubleClick(body)
    const editor = note.querySelector('.note__editor') as HTMLTextAreaElement
    fireEvent.change(editor, { target: { value: 'Delete me later' } })
    fireEvent.keyDown(editor, { key: 'Enter', metaKey: true })
    fireEvent.click(screen.getByRole('radio', { name: 'Set note color pink' }))

    const bodyEl = note.querySelector('.note__body') as HTMLElement
    fireEvent(bodyEl, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 400, clientY: 600 }))
    fireEvent(window, pointer('pointerup', { clientX: 400, clientY: 600 }))
    expect(noteEls()).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: /undo/i }))

    const restored = onlyNote()
    expect(restored.textContent).toContain('Delete me later')
    expect(restored.className).toContain('note--pink')
    expect(restored.style.left).toBe('64px')
    expect(restored.style.top).toBe('64px')
  })

  it('hides the undo offer after the timeout', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement
    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 400, clientY: 600 }))
    fireEvent(window, pointer('pointerup', { clientX: 400, clientY: 600 }))
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(8000)
    })
    expect(screen.queryByRole('button', { name: /undo/i })).toBeNull()
    expect(noteEls()).toHaveLength(0)
  })
})

describe('trash zone hover feedback', () => {
  it('lets the dragged note visually enter the trash strip', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement
    // Board usable height is 568 (640 minus the 72px strip); a 160px note is
    // capped at top=408 there. While dragging it may travel into the strip.
    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 74, clientY: 600 }))
    const topWhileDragging = Number.parseInt(note.style.top)
    expect(topWhileDragging).toBeGreaterThan(408)
    expect(note.classList).toContain('note--danger')
    fireEvent.keyDown(window, { key: 'Escape' })
  })

  it('snaps the note back above the strip when released outside the trash', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement
    fireEvent(body, pointer('pointerdown', { clientX: 74, clientY: 74 }))
    fireEvent(window, pointer('pointermove', { clientX: 74, clientY: 550 }))
    fireEvent(window, pointer('pointerup', { clientX: 74, clientY: 550 }))
    expect(note.style.top).toBe('408px')
    expect(noteEls()).toHaveLength(1)
  })
})

describe('stacking order', () => {
  it('brings a pressed note to the front', () => {
    renderBoard()
    const first = createViaButton()
    const second = createViaButton()
    expect(Number(second.style.zIndex)).toBeGreaterThan(Number(first.style.zIndex))

    const firstBody = first.querySelector('.note__body') as HTMLElement
    fireEvent(firstBody, pointer('pointerdown', { clientX: 80, clientY: 80 }))
    fireEvent(window, pointer('pointerup', { clientX: 80, clientY: 80 }))

    const notes = noteEls()
    const pressed = notes.find((note) => note === first) as HTMLElement
    const other = notes.find((note) => note === second) as HTMLElement
    expect(Number(pressed.style.zIndex)).toBeGreaterThan(Number(other.style.zIndex))
  })
})

describe('text editing', () => {
  it('edits text with double-click, saving on Ctrl+Enter', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement

    fireEvent.doubleClick(body)
    const editor = note.querySelector('.note__editor') as HTMLTextAreaElement
    expect(editor).not.toBeNull()
    fireEvent.change(editor, { target: { value: 'Buy oat milk' } })
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true })

    expect(note.querySelector('.note__editor')).toBeNull()
    expect(note.textContent).toContain('Buy oat milk')
  })

  it('reverts the text when Escape is pressed while editing', () => {
    renderBoard()
    const note = createViaButton()
    const body = note.querySelector('.note__body') as HTMLElement

    fireEvent.doubleClick(body)
    let editor = note.querySelector('.note__editor') as HTMLTextAreaElement
    fireEvent.change(editor, { target: { value: 'kept' } })
    fireEvent.keyDown(editor, { key: 'Enter', metaKey: true })
    expect(note.textContent).toContain('kept')

    fireEvent.doubleClick(note.querySelector('.note__body') as HTMLElement)
    editor = note.querySelector('.note__editor') as HTMLTextAreaElement
    expect(editor.value).toBe('kept')
    fireEvent.change(editor, { target: { value: 'discarded' } })
    fireEvent.keyDown(editor, { key: 'Escape' })

    expect(note.textContent).toContain('kept')
    expect(note.textContent).not.toContain('discarded')
  })

  it('shows the placeholder for empty notes', () => {
    renderBoard()
    const note = createViaButton()
    expect(note.textContent).toContain('Double-click to write')
  })
})

describe('colors', () => {
  it('recolors a note from its palette', () => {
    renderBoard()
    const note = createViaButton()
    expect(note.className).toContain('note--yellow')
    fireEvent.click(screen.getByRole('radio', { name: 'Set note color green' }))
    expect(note.className).toContain('note--green')
  })
})

describe('persistence wiring', () => {
  it('restores notes from localStorage on load', () => {
    window.localStorage.setItem(
      BOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        notes: [
          {
            id: 'restored-1',
            x: 321,
            y: 123,
            width: 200,
            height: 100,
            text: 'Persisted',
            color: 'purple',
            zIndex: 4,
          },
        ],
      }),
    )
    renderBoard()
    const note = onlyNote()
    expect(note.style.left).toBe('321px')
    expect(note.style.top).toBe('123px')
    expect(note.textContent).toContain('Persisted')
    expect(note.className).toContain('note--purple')
  })

  it('ignores corrupt stored payloads and starts empty', () => {
    window.localStorage.setItem(BOARD_STORAGE_KEY, '{broken')
    renderBoard()
    expect(noteEls()).toHaveLength(0)
  })

  it('saves changes to localStorage (debounced)', () => {
    renderBoard()
    createViaButton()
    act(() => {
      vi.advanceTimersByTime(300)
    })
    const persisted = JSON.parse(
      window.localStorage.getItem(BOARD_STORAGE_KEY) as string,
    ) as { version: number; notes: Array<{ x: number; y: number }> }
    expect(persisted.version).toBe(1)
    expect(persisted.notes).toHaveLength(1)
    expect(persisted.notes[0]).toMatchObject({ x: 64, y: 64 })
  })
})

describe('async sync through the mock REST API', () => {
  it('flips the status to synced after a change is persisted remotely', async () => {
    vi.useRealTimers()
    const api = new MockRestNotesApi({ minDelayMs: 10, maxDelayMs: 10 })
    renderBoard(api)
    createViaButton()
    await waitFor(() => {
      expect(screen.getByText('Synced')).toBeTruthy()
    }, { timeout: 2000 })
    expect(api.callCount).toBeGreaterThanOrEqual(1)
  })

  it('surfaces mock failures as an error state without breaking the board', async () => {
    vi.useRealTimers()
    const api = new MockRestNotesApi({ minDelayMs: 5, maxDelayMs: 5 })
    api.failNext()
    renderBoard(api)
    createViaButton()
    await waitFor(() => {
      expect(screen.getByText('Sync failed (mock API)')).toBeTruthy()
    }, { timeout: 2000 })
    // The board stays usable after a failed sync.
    expect(noteEls()).toHaveLength(1)
  })

  it('serializes overlapping saves instead of racing them', async () => {
    vi.useRealTimers()
    const api = new MockRestNotesApi({
      minDelayMs: 500,
      maxDelayMs: 500,
      random: () => 0,
    })
    renderBoard(api)
    createViaButton()
    await waitFor(() => {
      expect(screen.getByText('Syncing…')).toBeTruthy()
    })
    // Change while the first save is in flight → must queue, not race.
    fireEvent.click(screen.getByRole('button', { name: /new note/i }))
    await waitFor(() => {
      expect(screen.getByText('Synced')).toBeTruthy()
    }, { timeout: 2000 })
    expect(api.callCount).toBe(2)
  })
})
