import { describe, expect, it } from 'vitest'
import type { Note } from '../domain/note'
import { MockRestNotesApi } from './mockApi'

function notes(): Note[] {
  return [
    {
      id: 'n1',
      x: 0,
      y: 0,
      width: 240,
      height: 160,
      text: 'a',
      color: 'blue',
      zIndex: 1,
    },
  ]
}

describe('MockRestNotesApi', () => {
  it('resolves asynchronously and stores the payload', async () => {
    const api = new MockRestNotesApi({ minDelayMs: 1, maxDelayMs: 2 })
    const promise = api.saveAll(notes())
    // The save must NOT have landed synchronously.
    expect(api.savedNotes).toBeNull()
    await promise
    expect(api.savedNotes).toEqual(notes())
    expect(api.callCount).toBe(1)
  })

  it('simulates real latency', async () => {
    const api = new MockRestNotesApi({
      minDelayMs: 30,
      maxDelayMs: 30,
      random: () => 0,
    })
    const started = Date.now()
    await api.saveAll(notes())
    expect(Date.now() - started).toBeGreaterThanOrEqual(25)
  })

  it('supports scripted failures for testing and demoing error states', async () => {
    const api = new MockRestNotesApi({ minDelayMs: 1, maxDelayMs: 1 })
    api.failNext()
    await expect(api.saveAll(notes())).rejects.toThrow()
    expect(api.savedNotes).toBeNull()
    // A scripted failure affects only the next call.
    await api.saveAll(notes())
    expect(api.savedNotes).toEqual(notes())
  })
})
