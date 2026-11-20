/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, loadThemePreference } from './theme'
import type { ThemePreference } from './theme'

// The pre-paint snippet in index.html cannot import app/theme.ts — it has to be
// inline to run before the bundle — so the two implementations are duplicated by
// necessity. This test is what keeps them honest: it runs the inline script and
// the module against the same matrix and fails the moment they disagree.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
const inlineSource = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1]

function clearRoot(): void {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.themePreference
}

function stubEnvironment(stored: string | null, systemPrefersDark: boolean): void {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(stored)
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('dark') && systemPrefersDark,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}

function rootAttributes(): { theme?: string; preference?: string } {
  return {
    theme: document.documentElement.dataset.theme,
    preference: document.documentElement.dataset.themePreference,
  }
}

function runInlineScript(): void {
  // `inlineSource` is the repo's own index.html, read from disk at test time —
  // there is no user or network input in this string. It is the only way to
  // execute what the browser runs before the bundle boots.
  new Function(inlineSource as string)()
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  clearRoot()
})

describe('theme pre-paint script parity', () => {
  it('is present in index.html', () => {
    expect(inlineSource).toBeTruthy()
  })

  const storedValues = [null, 'system', 'light', 'dark', 'neon'] as const
  for (const stored of storedValues) {
    for (const systemPrefersDark of [false, true]) {
      it(`matches the module for stored=${String(stored)} and a ${systemPrefersDark ? 'dark' : 'light'} system`, () => {
        stubEnvironment(stored, systemPrefersDark)

        clearRoot()
        runInlineScript()
        const fromScript = rootAttributes()

        clearRoot()
        applyTheme(loadThemePreference(), systemPrefersDark)
        const fromModule = rootAttributes()

        expect(fromScript).toEqual(fromModule)
        expect(fromScript.theme).toBe(
          systemPrefersDark && (stored === null || stored === 'system' || stored === 'neon')
            ? 'dark'
            : stored === 'dark'
              ? 'dark'
              : 'light',
        )
      })
    }
  }

  it('falls back to system when reading the preference throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    clearRoot()
    runInlineScript()
    const fromScript = rootAttributes()

    clearRoot()
    applyTheme(loadThemePreference(), true)
    const fromModule = rootAttributes()

    expect(fromScript).toEqual(fromModule)
    expect(fromScript).toEqual({ theme: 'dark', preference: 'system' })
  })

  it('agrees on every preference the module can produce', () => {
    const preferences: ThemePreference[] = ['system', 'light', 'dark']
    for (const preference of preferences) {
      for (const systemPrefersDark of [false, true]) {
        stubEnvironment(preference, systemPrefersDark)
        clearRoot()
        runInlineScript()
        const fromScript = rootAttributes()
        clearRoot()
        applyTheme(preference, systemPrefersDark)
        expect(fromScript).toEqual(rootAttributes())
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
      }
    }
  })
})
