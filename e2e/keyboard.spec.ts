import { expect, test } from '@playwright/test'
import { noteGeometry, openEmptyBoard, SAVE_MODIFIER } from './support'

const focusedRole = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.activeElement?.getAttribute('role') ?? null)

test.beforeEach(async ({ page }) => {
  await openEmptyBoard(page)
})

test('creates a note from the keyboard and focuses it', async ({ page }) => {
  await page.getByRole('button', { name: '+ New note' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.locator('.note')).toHaveCount(1)
  await expect(page.locator('.note')).toHaveAttribute('role', 'group')
  await expect(page.locator('.note')).toHaveAttribute('tabindex', '0')
  await expect(page.locator('.note')).toHaveAttribute('aria-label', 'Empty note')
  expect(await focusedRole(page)).toBe('group')
})

test('moves and resizes the focused note with the arrow keys', async ({ page }) => {
  await page.getByRole('button', { name: '+ New note' }).focus()
  await page.keyboard.press('Enter')

  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowDown')
  expect(await noteGeometry(page)).toEqual({
    left: 80,
    top: 72,
    width: 240,
    height: 160,
  })

  await page.keyboard.press('Shift+ArrowRight')
  await page.keyboard.press('Shift+ArrowDown')
  expect(await noteGeometry(page)).toEqual({
    left: 80,
    top: 72,
    width: 248,
    height: 168,
  })
})

test('edits with Enter, discards with Escape and keeps focus on the note', async ({ page }) => {
  await page.getByRole('button', { name: '+ New note' }).focus()
  await page.keyboard.press('Enter')

  await page.keyboard.press('Enter')
  await expect(page.locator('.note__editor')).toHaveCount(1)
  await page.keyboard.type('typed but discarded')
  await page.keyboard.press('Escape')

  await expect(page.locator('.note__editor')).toHaveCount(0)
  await expect(page.locator('.note__body')).toContainText('Double-click to write')
  expect(await focusedRole(page)).toBe('group')

  await page.keyboard.press('Enter')
  await page.keyboard.type('Saved by keyboard')
  await page.keyboard.press(`${SAVE_MODIFIER}+Enter`)

  await expect(page.locator('.note__body')).toHaveText('Saved by keyboard')
})

test('deletes with the Delete key and undoes it', async ({ page }) => {
  await page.getByRole('button', { name: '+ New note' }).focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.keyboard.type('Keep me around')
  await page.keyboard.press(`${SAVE_MODIFIER}+Enter`)

  await page.keyboard.press('Delete')
  await expect(page.locator('.note')).toHaveCount(0)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('.note')).toHaveCount(1)
  await expect(page.locator('.note__body')).toHaveText('Keep me around')
  expect(await focusedRole(page)).toBe('group')
})

test('tabbing from a note reaches its colour swatches', async ({ page }) => {
  await page.getByRole('button', { name: '+ New note' }).focus()
  await page.keyboard.press('Enter')

  await page.keyboard.press('Tab')
  const focusedClass = await page.evaluate(
    () => document.activeElement?.className ?? '',
  )
  expect(focusedClass).toContain('note__dot')
})
