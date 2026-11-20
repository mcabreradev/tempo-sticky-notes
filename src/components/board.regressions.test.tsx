import { act, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createNote,
  mockLayoutRects,
  noteBody,
  noteEls,
  pointer,
  renderBoard,
} from '../test/boardHarness'
import { MockRestNotesApi } from '../infra/mockApi'

let layout: ReturnType<typeof mockLayoutRects>

beforeEach(() => {
  vi.useFakeTimers()
  layout = mockLayoutRects()
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('editing after a cancelled edit', () => {
  it('still commits the next edit once an Escape has been cancelled', () => {
    renderBoard()
    const note = createNote()

    // First edit: discard it.
    fireEvent.doubleClick(noteBody(note))
    let editor = note.querySelector('.note__editor') as HTMLTextAreaElement
    fireEvent.change(editor, { target: { value: 'borrador' } })
    fireEvent.keyDown(editor, { key: 'Escape' })
    expect(note.querySelector('.note__editor')).toBeNull()

    // Second edit: this one must save. Before the fix, the skip-commit flag was
    // only cleared by a blur that may never arrive, so this edit was lost.
    fireEvent.keyDown(note, { key: 'Enter' })
    editor = note.querySelector('.note__editor') as HTMLTextAreaElement
    fireEvent.change(editor, { target: { value: 'texto real' } })
    // React maps onBlur to focusout; jsdom's blur() alone does not dispatch it.
    fireEvent.focusOut(editor)

    expect(note.querySelector('.note__editor')).toBeNull()
    expect(noteBody(note).textContent).toBe('texto real')
  })
})

describe('colour palette semantics', () => {
  it('exposes a single tab stop and moves the selection with the arrow keys', () => {
    renderBoard()
    const note = createNote()
    const dots = Array.from(note.querySelectorAll<HTMLElement>('.note__dot'))
    expect(dots).toHaveLength(6)

    const tabbable = dots.filter((dot) => dot.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]?.getAttribute('aria-checked')).toBe('true')

    const selected = tabbable[0] as HTMLElement
    selected.focus()
    fireEvent.keyDown(selected, { key: 'ArrowRight' })

    const after = Array.from(note.querySelectorAll<HTMLElement>('.note__dot'))
    const nowSelected = after.filter((dot) => dot.getAttribute('aria-checked') === 'true')
    expect(nowSelected).toHaveLength(1)
    expect(nowSelected[0]?.getAttribute('aria-label')).toBe('Set note color green')
    expect(document.activeElement).toBe(nowSelected[0])
    expect(note.className).toContain('note--green')
  })
})

describe('stacking without churn', () => {
  it('does not raise, re-render or sync when pressing a note that is already on top', async () => {
    const api = new MockRestNotesApi({ minDelayMs: 5, maxDelayMs: 5 })
    renderBoard(api)
    const note = createNote()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    const callsAfterCreate = api.callCount
    const zBefore = note.style.zIndex

    for (let press = 0; press < 5; press += 1) {
      fireEvent(noteBody(note), pointer('pointerdown', { clientX: 74, clientY: 74 }))
      fireEvent(window, pointer('pointerup', { clientX: 74, clientY: 74 }))
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })

    expect(noteEls()[0]?.style.zIndex).toBe(zBefore)
    expect(api.callCount).toBe(callsAfterCreate)
  })

  it('raises a note pressed by any of its controls, not just its body', () => {
    renderBoard()
    const first = createNote()
    const second = createNote()
    expect(Number(second.style.zIndex)).toBeGreaterThan(Number(first.style.zIndex))

    const swatch = first.querySelector('.note__dot') as HTMLElement
    fireEvent(swatch, pointer('pointerdown', { clientX: 90, clientY: 70 }))
    fireEvent(window, pointer('pointerup', { clientX: 90, clientY: 70 }))

    expect(Number(first.style.zIndex)).toBeGreaterThan(Number(second.style.zIndex))
  })
})

describe('focus management', () => {
  it('hands focus to the neighbouring note when the focused one is deleted', () => {
    renderBoard()
    const first = createNote()
    const second = createNote()

    first.focus()
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(first, { key: 'Delete' })

    expect(noteEls()).toHaveLength(1)
    expect(document.activeElement).toBe(second)
  })
})

describe('viewport changes', () => {
  it('clamps every note into the new bounds when the board shrinks', () => {
    renderBoard()
    const note = createNote()
    expect(note.style.left).toBe('64px')
    expect(note.style.top).toBe('64px')

    layout.resize({ width: 300, height: 200 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Usable area is 300x128 (200 minus the measured 72px trash strip).
    expect(note.style.left).toBe('60px')
    expect(note.style.top).toBe('0px')
    expect(note.style.height).toBe('128px')
  })
})
