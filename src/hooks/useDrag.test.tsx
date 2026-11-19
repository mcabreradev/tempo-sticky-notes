import { createRef } from 'react'
import type { ReactElement } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDrag } from './useDrag'
import type { DragSession, DragStarter } from './useDrag'

function pointer(
  type: string,
  init: PointerEventInit = {},
): PointerEvent {
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

function makeSession(): DragSession {
  return {
    onMove: vi.fn<DragSession['onMove']>(),
    onEnd: vi.fn<DragSession['onEnd']>(),
    onCancel: vi.fn<DragSession['onCancel']>(),
  }
}

describe('useDrag', () => {
  function renderProbe(onDragStart: DragStarter): {
    zone: HTMLElement
  } {
    const Probe = (): ReactElement => {
      const ref = createRef<HTMLDivElement>()
      const { startDrag } = useDrag()
      return (
        <div
          ref={ref}
          data-testid="zone"
          style={{ width: 400, height: 300 }}
          onPointerDown={(event) => startDrag(event, onDragStart)}
        />
      )
    }
    const { getByTestId } = render(<Probe />)
    return { zone: getByTestId('zone') }
  }

  it('starts a session on primary pointer down and reports deltas', () => {
    const session = makeSession()
    const onDragStart = vi.fn(() => session)
    const { zone } = renderProbe(onDragStart)

    fireEvent(zone, pointer('pointerdown', { clientX: 10, clientY: 15 }))
    expect(onDragStart).toHaveBeenCalledWith({ x: 10, y: 15 })

    fireEvent(window, pointer('pointermove', { clientX: 60, clientY: 45 }))
    expect(session.onMove).toHaveBeenLastCalledWith(
      50,
      30,
      { x: 60, y: 45 },
      expect.anything(),
    )

    fireEvent(window, pointer('pointermove', { clientX: 30, clientY: 20 }))
    expect(session.onMove).toHaveBeenLastCalledWith(
      20,
      5,
      { x: 30, y: 20 },
      expect.anything(),
    )

    fireEvent(window, pointer('pointerup', { clientX: 30, clientY: 20 }))
    expect(session.onEnd).toHaveBeenCalledWith({ x: 30, y: 20 })

    // After release, moves no longer reach the session.
    fireEvent(window, pointer('pointermove', { clientX: 999, clientY: 999 }))
    expect(session.onMove).toHaveBeenCalledTimes(2)
  })

  it('ignores non-primary buttons', () => {
    const onDragStart = vi.fn(() => makeSession())
    const { zone } = renderProbe(onDragStart)
    fireEvent(zone, pointer('pointerdown', { button: 2, clientX: 5, clientY: 5 }))
    expect(onDragStart).not.toHaveBeenCalled()
  })

  it('cancels the session with Escape, restoring control and stopping moves', () => {
    const session = makeSession()
    const { zone } = renderProbe(() => session)

    fireEvent(zone, pointer('pointerdown', { clientX: 10, clientY: 10 }))
    fireEvent(window, pointer('pointermove', { clientX: 40, clientY: 40 }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(session.onCancel).toHaveBeenCalledOnce()
    expect(session.onEnd).not.toHaveBeenCalled()

    fireEvent(window, pointer('pointermove', { clientX: 70, clientY: 70 }))
    fireEvent(window, pointer('pointerup', { clientX: 70, clientY: 70 }))
    expect(session.onMove).toHaveBeenCalledTimes(1)
    expect(session.onEnd).not.toHaveBeenCalled()
  })

  it('cancels on pointercancel (e.g., the browser takes the gesture over)', () => {
    const session = makeSession()
    const { zone } = renderProbe(() => session)

    fireEvent(zone, pointer('pointerdown', { clientX: 10, clientY: 10 }))
    fireEvent(window, pointer('pointercancel', { clientX: 12, clientY: 12 }))
    expect(session.onCancel).toHaveBeenCalledOnce()
  })

  it('does not start when onDragStart returns null (e.g., drag not allowed)', () => {
    const onDragStart = vi.fn(() => null)
    const { zone } = renderProbe(onDragStart)
    fireEvent(zone, pointer('pointerdown', { clientX: 5, clientY: 5 }))
    fireEvent(window, pointer('pointermove', { clientX: 50, clientY: 50 }))
    expect(onDragStart).toHaveBeenCalledTimes(1)
    // Nothing follows a rejected start.
    fireEvent(window, pointer('pointerup', { clientX: 50, clientY: 50 }))
  })

  it('supports sequential sessions after cleanup', () => {
    const first = makeSession()
    const second = makeSession()
    const sessions = [first, second]
    const onDragStart = vi.fn(() => sessions[0] ?? null)
    const { zone } = renderProbe(onDragStart)

    fireEvent(zone, pointer('pointerdown', { clientX: 0, clientY: 0 }))
    fireEvent(window, pointer('pointerup', { clientX: 10, clientY: 10 }))
    expect(first.onEnd).toHaveBeenCalledOnce()

    sessions.shift()
    fireEvent(zone, pointer('pointerdown', { clientX: 100, clientY: 100 }))
    fireEvent(window, pointer('pointermove', { clientX: 150, clientY: 150 }))
    expect(second.onMove).toHaveBeenCalledWith(
      50,
      50,
      { x: 150, y: 150 },
      expect.anything(),
    )
  })
})
