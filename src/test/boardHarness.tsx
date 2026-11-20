import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { NotesProvider } from '../app/NotesProvider'
import { Board } from '../components/Board'
import { MockRestNotesApi } from '../infra/mockApi'

export interface BoardSize {
  width: number
  height: number
}

export function pointer(type: string, init: PointerEventInit = {}): PointerEvent {
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

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    left: x,
    top: y,
    width,
    height,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect
}

// jsdom has no layout: the board and its trash strip are mocked so geometry
// tests are deterministic. `resize` mutates the fake viewport.
export function mockLayoutRects(
  initial: BoardSize = { width: 1024, height: 640 },
  trashHeight = 72,
): { resize: (next: BoardSize) => void } {
  const layout = { size: initial, trashHeight }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement): DOMRect {
      if (this.classList.contains('board')) {
        return rect(0, 0, layout.size.width, layout.size.height)
      }
      if (this.classList.contains('trash')) {
        return rect(
          0,
          layout.size.height - layout.trashHeight,
          layout.size.width,
          layout.trashHeight,
        )
      }
      return rect(0, 0, 0, 0)
    },
  )
  return {
    resize: (next: BoardSize) => {
      layout.size = next
    },
  }
}

export function renderBoard(
  api = new MockRestNotesApi({ minDelayMs: 5, maxDelayMs: 5 }),
): ReturnType<typeof render> {
  return render(
    <NotesProvider api={api}>
      <Board />
    </NotesProvider>,
  )
}

export function boardEl(): HTMLElement {
  return document.querySelector('.board') as HTMLElement
}

export function noteEls(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.note'))
}

export function createNote(): HTMLElement {
  const before = noteEls().length
  fireEvent.click(screen.getByRole('button', { name: /new note/i }))
  const notes = noteEls()
  const created = notes[notes.length - 1]
  if (!created || notes.length === before) {
    throw new Error('the note was not created')
  }
  return created
}

export function noteBody(note: HTMLElement): HTMLElement {
  return note.querySelector('.note__body') as HTMLElement
}
