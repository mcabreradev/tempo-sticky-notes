import { expect, test } from '@playwright/test'
import {
  createNoteWithButton,
  dragNoteBy,
  noteGeometry,
  openEmptyBoard,
  SAVE_MODIFIER,
} from './support'

test.beforeEach(async ({ page }) => {
  await openEmptyBoard(page)
})

test('restores geometry, text and colour after a reload', async ({ page }) => {
  await createNoteWithButton(page)
  await page.locator('.note__body').dblclick()
  await page.locator('.note__editor').fill('Survive the reload')
  await page.keyboard.press(`${SAVE_MODIFIER}+Enter`)

  const note = page.locator('.note').first()
  await note.hover()
  await page.getByRole('radio', { name: 'Set note color purple' }).click()
  await dragNoteBy(page, 0, { x: 40, y: 20 })

  const beforeReload = await noteGeometry(page)
  await page.waitForTimeout(400) // let the debounced write land
  await page.reload()

  await expect(page.locator('.note')).toHaveCount(1)
  expect(await noteGeometry(page)).toEqual(beforeReload)
  await expect(page.locator('.note__body')).toHaveText('Survive the reload')
  await expect(page.locator('.note')).toHaveClass(/note--purple/)
})

test('starts empty when the stored payload is corrupt', async ({ page }) => {
  await page.evaluate(() =>
    window.localStorage.setItem('sticky-notes-board-v1', '{not json'),
  )
  await page.reload()

  await expect(page.locator('.board')).toBeVisible()
  await expect(page.locator('.note')).toHaveCount(0)
})

test('reports the async sync lifecycle and settles back to idle', async ({ page }) => {
  await createNoteWithButton(page)

  const status = page.locator('.sync')
  await expect(status).toContainText('Synced', { timeout: 10_000 })
  await expect(status).toContainText('Saved locally', { timeout: 10_000 })
})
