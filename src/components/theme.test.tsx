import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockLayoutRects, renderBoard } from '../test/boardHarness'
import { THEME_STORAGE_KEY } from '../app/theme'

const rootTheme = () => document.documentElement.dataset.theme
const rootPreference = () => document.documentElement.dataset.themePreference
const checked = (testId: string) =>
  screen.getByTestId(testId).getAttribute('aria-checked')

beforeEach(() => {
  vi.useFakeTimers()
  mockLayoutRects()
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
  vi.restoreAllMocks()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.themePreference
})

describe('theme preference', () => {
  it('starts in system mode', () => {
    renderBoard()

    expect(rootPreference()).toBe('system')
    expect(rootTheme()).toBe('light')
    expect(checked('theme-system')).toBe('true')
    expect(checked('theme-dark')).toBe('false')
  })

  it('applies and remembers an explicit dark choice', () => {
    renderBoard()

    fireEvent.click(screen.getByTestId('theme-dark'))

    expect(rootTheme()).toBe('dark')
    expect(rootPreference()).toBe('dark')
    expect(checked('theme-dark')).toBe('true')
    expect(checked('theme-system')).toBe('false')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('restores the stored choice on the next load', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')

    renderBoard()

    expect(rootTheme()).toBe('light')
    expect(checked('theme-light')).toBe('true')
  })

  it('falls back to system when the stored value is invalid', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia')

    renderBoard()

    expect(rootPreference()).toBe('system')
    expect(checked('theme-system')).toBe('true')
  })
})
