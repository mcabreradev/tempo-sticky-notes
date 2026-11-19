import { describe, expect, it } from 'vitest'
import {
  clamp,
  clampRectToBounds,
  containsPoint,
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
  findFreeSlot,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  normalizeRect,
} from './note'

describe('clamp', () => {
  it('clamps below the minimum', () => {
    expect(clamp(4, 10, 20)).toBe(10)
  })

  it('clamps above the maximum', () => {
    expect(clamp(25, 10, 20)).toBe(20)
  })

  it('keeps in-range values', () => {
    expect(clamp(15, 10, 20)).toBe(15)
  })
})

describe('normalizeRect', () => {
  it('builds a rect from a top-left to bottom-right drag', () => {
    expect(normalizeRect({ x: 200, y: 150 }, { x: 440, y: 270 })).toEqual({
      x: 200,
      y: 150,
      width: 240,
      height: 120,
    })
  })

  it('normalizes drags towards the top-left', () => {
    expect(normalizeRect({ x: 440, y: 270 }, { x: 200, y: 150 })).toEqual({
      x: 200,
      y: 150,
      width: 240,
      height: 120,
    })
  })

  it('enforces the minimum note size', () => {
    const rect = normalizeRect({ x: 100, y: 100 }, { x: 104, y: 102 })
    expect(rect.width).toBe(MIN_NOTE_WIDTH)
    expect(rect.height).toBe(MIN_NOTE_HEIGHT)
  })
})

describe('clampRectToBounds', () => {
  const bounds = { width: 1024, height: 640 }

  it('keeps rects already inside unchanged', () => {
    expect(
      clampRectToBounds({ x: 10, y: 10, width: 200, height: 120 }, bounds),
    ).toEqual({ x: 10, y: 10, width: 200, height: 120 })
  })

  it('clamps rects overflowing the right and bottom edges', () => {
    expect(
      clampRectToBounds({ x: 900, y: 600, width: 240, height: 160 }, bounds),
    ).toEqual({ x: 784, y: 480, width: 240, height: 160 })
  })

  it('clamps rects overflowing the left and top edges', () => {
    expect(
      clampRectToBounds({ x: -40, y: -20, width: 200, height: 120 }, bounds),
    ).toEqual({ x: 0, y: 0, width: 200, height: 120 })
  })

  it('shrinks rects larger than the bounds', () => {
    expect(
      clampRectToBounds({ x: 10, y: 10, width: 2000, height: 1200 }, bounds),
    ).toEqual({ x: 0, y: 0, width: 1024, height: 640 })
  })
})

describe('containsPoint', () => {
  const rect = { x: 100, y: 100, width: 50, height: 40 }

  it('detects points inside', () => {
    expect(containsPoint(rect, { x: 120, y: 120 })).toBe(true)
  })

  it('detects points outside', () => {
    expect(containsPoint(rect, { x: 90, y: 120 })).toBe(false)
    expect(containsPoint(rect, { x: 160, y: 120 })).toBe(false)
  })
})

describe('findFreeSlot', () => {
  const bounds = { width: 1024, height: 640 }

  it('returns the first cascade slot on an empty board', () => {
    expect(findFreeSlot([], bounds)).toEqual({
      x: 64,
      y: 64,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
    })
  })

  it('skips slots occupied by an existing note', () => {
    const occupied = {
      id: 'a',
      x: 64,
      y: 64,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
      text: '',
      color: 'yellow' as const,
      zIndex: 1,
    }
    const slot = findFreeSlot([occupied], bounds)
    // Default notes are 240x160, so the first non-overlapping staircase slot
    // is the one shifted 8 steps (>= note width) right and down: 64+5*32,
    // where vertical edge is reached first (64+160 = 224).
    expect(slot).toEqual({
      x: 224,
      y: 224,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
    })
  })

  it('keeps slots fully inside the board', () => {
    const slot = findFreeSlot([], { width: 200, height: 120 })
    expect(slot.x + slot.width).toBeLessThanOrEqual(200)
    expect(slot.y + slot.height).toBeLessThanOrEqual(120)
    expect(slot.width).toBeGreaterThanOrEqual(MIN_NOTE_WIDTH)
    expect(slot.height).toBeGreaterThanOrEqual(MIN_NOTE_HEIGHT)
  })
})
