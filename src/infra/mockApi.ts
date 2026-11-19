import type { Note } from '../domain/note'

// The assessment asks for an asynchronous REST mock. This interface is the
// seam where a real API client could replace the mock without touching the
// board logic.
export interface NotesApi {
  saveAll(notes: Note[]): Promise<void>
}

export interface MockRestOptions {
  minDelayMs?: number
  maxDelayMs?: number
  random?: () => number
}

export class MockRestNotesApi implements NotesApi {
  private readonly minDelayMs: number
  private readonly maxDelayMs: number
  private readonly random: () => number
  private failOnce = false

  public savedNotes: Note[] | null = null
  public callCount = 0

  constructor(options: MockRestOptions = {}) {
    this.minDelayMs = options.minDelayMs ?? 250
    this.maxDelayMs = options.maxDelayMs ?? 600
    this.random = options.random ?? Math.random
  }

  failNext(): void {
    this.failOnce = true
  }

  private delayMs(): number {
    return (
      this.minDelayMs +
      this.random() * Math.max(0, this.maxDelayMs - this.minDelayMs)
    )
  }

  saveAll(notes: Note[]): Promise<void> {
    this.callCount += 1
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.failOnce) {
          this.failOnce = false
          reject(new Error('mock REST write failed'))
          return
        }
        this.savedNotes = notes.map((note) => ({ ...note }))
        resolve()
      }, this.delayMs())
    })
  }
}
