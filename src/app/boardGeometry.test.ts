import { describe, expect, it } from 'vitest'
import { EMPTY_GEOMETRY, measureBoard, toBoardPoint } from './boardGeometry'

function elementAt(x: number, y: number, width: number, height: number): HTMLElement {
  const node = document.createElement('div')
  node.getBoundingClientRect = () =>
    ({
      x,
      y,
      left: x,
      top: y,
      width,
      height,
      right: x + width,
      bottom: y + height,
      toJSON: () => ({}),
    }) as DOMRect
  return node
}

describe('measureBoard', () => {
  it('derives the usable area from the trash strip instead of a constant', () => {
    const board = elementAt(100, 50, 1024, 640)
    const trash = elementAt(100, 618, 1024, 72)

    const geometry = measureBoard(board, trash)

    expect(geometry.origin).toEqual({ x: 100, y: 50 })
    expect(geometry.fullSize).toEqual({ width: 1024, height: 640 })
    expect(geometry.size).toEqual({ width: 1024, height: 568 })
    expect(geometry.trash).toEqual({ x: 0, y: 568, width: 1024, height: 72 })
  })

  it('falls back to the whole board when there is no trash element', () => {
    const geometry = measureBoard(elementAt(0, 0, 800, 600), null)
    expect(geometry.size).toEqual({ width: 800, height: 600 })
    expect(geometry.trash.height).toBe(0)
  })

  it('returns an empty geometry instead of throwing when the board is missing', () => {
    expect(measureBoard(null, null)).toBe(EMPTY_GEOMETRY)
  })

  it('converts client coordinates into board space', () => {
    expect(toBoardPoint({ x: 100, y: 50 }, { x: 130, y: 120 })).toEqual({
      x: 30,
      y: 70,
    })
  })
})
