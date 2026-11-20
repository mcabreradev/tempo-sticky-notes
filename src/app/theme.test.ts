import { describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  isThemePreference,
  loadThemePreference,
  parseThemePreference,
  resolveTheme,
  saveThemePreference,
  THEME_STORAGE_KEY,
} from '../app/theme'

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

describe('theme preference values', () => {
  it('accepts the three valid preferences', () => {
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isThemePreference('sepia')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })
})

describe('parseThemePreference', () => {
  it('reads a stored preference', () => {
    expect(parseThemePreference('dark')).toBe('dark')
  })

  it('falls back to system when the value is missing', () => {
    expect(parseThemePreference(null)).toBe('system')
  })

  it('falls back to system when the value is invalid', () => {
    expect(parseThemePreference('neon')).toBe('system')
  })
})

describe('resolveTheme', () => {
  it('follows the system scheme in system mode', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('lets an explicit choice win over the system scheme', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('loadThemePreference / saveThemePreference', () => {
  it('returns system when nothing is stored', () => {
    window.localStorage.clear()
    expect(loadThemePreference()).toBe('system')
  })

  it('round-trips a choice', () => {
    saveThemePreference('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(loadThemePreference()).toBe('light')
  })

  it('falls back to system when storage throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(loadThemePreference(throwingStorage())).toBe('system')
    expect(() => saveThemePreference('dark', throwingStorage())).not.toThrow()
    warn.mockRestore()
  })
})

describe('applyTheme', () => {
  it('writes the resolved theme and the preference on the document root', () => {
    applyTheme('dark', false)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.themePreference).toBe('dark')

    applyTheme('system', true)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.dataset.themePreference).toBe('system')
  })
})
