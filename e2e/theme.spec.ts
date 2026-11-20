import { expect, test } from '@playwright/test'
import { boardOf, openEmptyBoard } from './support'

const themeOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.theme)

const toolbarBackground = (page: import('@playwright/test').Page) =>
  page.getByTestId('toolbar').evaluate((el) => getComputedStyle(el).backgroundColor)

test.beforeEach(async ({ page }) => {
  await openEmptyBoard(page)
})

test('starts in system mode with the emulated scheme', async ({ page }) => {
  await expect(page.getByTestId('theme-system')).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(await themeOf(page)).toBe('light')
})

test('an explicit dark choice applies, persists and repaints the surface', async ({ page }) => {
  const lightBackground = await toolbarBackground(page)

  await page.getByTestId('theme-dark').click()

  expect(await themeOf(page)).toBe('dark')
  await expect(page.getByTestId('theme-dark')).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(await toolbarBackground(page)).not.toBe(lightBackground)

  await page.reload()
  // The pre-paint script resolves the stored preference before React mounts.
  expect(await themeOf(page)).toBe('dark')
  await expect(page.getByTestId('theme-dark')).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(await boardOf(page).isVisible()).toBe(true)
})

test.describe('with a dark operating system', () => {
  test.use({ colorScheme: 'dark' })

  test('light overrides the system scheme', async ({ page }) => {
    expect(await themeOf(page)).toBe('dark')

    await page.getByTestId('theme-light').click()

    expect(await themeOf(page)).toBe('light')
    await expect(page.getByTestId('theme-light')).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  test('system follows a live scheme change', async ({ page }) => {
    expect(await themeOf(page)).toBe('dark')

    await page.emulateMedia({ colorScheme: 'light' })
    await expect.poll(() => themeOf(page)).toBe('light')

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect.poll(() => themeOf(page)).toBe('dark')
  })
})

test('a corrupt preference falls back to system', async ({ page }) => {
  await page.evaluate(() =>
    window.localStorage.setItem('sticky-notes-theme-v1', 'sepia'),
  )
  await page.reload()

  await expect(page.getByTestId('theme-system')).toHaveAttribute(
    'aria-checked',
    'true',
  )
  expect(await themeOf(page)).toBe('light')
})

test('the control is reachable and operable from the keyboard', async ({ page }) => {
  await page.getByTestId('theme-dark').focus()
  await page.keyboard.press('Enter')

  expect(await themeOf(page)).toBe('dark')
  await expect(page.getByTestId('theme-dark')).toHaveAttribute(
    'aria-checked',
    'true',
  )
})
