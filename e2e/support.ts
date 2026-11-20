import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export interface Point {
  x: number
  y: number
}

export interface NoteRect {
  left: number
  top: number
  width: number
  height: number
}

export const TRASH_STRIP_HEIGHT = 72

/** Loads the app with an empty board. */
export async function openEmptyBoard(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await expect(page.locator('.board')).toBeVisible()
}

export async function boardBox(page: Page) {
  const box = await page.locator('.board').boundingBox()
  if (!box) {
    throw new Error('the board is not visible')
  }
  return box
}

export async function dragMouse(page: Page, from: Point, to: Point): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 8 })
  await page.mouse.up()
}

export async function noteGeometry(page: Page, index = 0): Promise<NoteRect> {
  return page
    .locator('.note')
    .nth(index)
    .evaluate((el: HTMLElement) => ({
      left: Number.parseFloat(el.style.left),
      top: Number.parseFloat(el.style.top),
      width: Number.parseFloat(el.style.width),
      height: Number.parseFloat(el.style.height),
    }))
}

export async function createNoteWithButton(page: Page): Promise<void> {
  await page.getByRole('button', { name: '+ New note' }).click()
}

/** Presses a note near its top and drags by a delta, in CSS pixels. */
export async function dragNoteBy(
  page: Page,
  index: number,
  delta: Point,
): Promise<void> {
  const box = await page.locator('.note').nth(index).boundingBox()
  if (!box) {
    throw new Error('the note is not visible')
  }
  const start = { x: box.x + box.width / 2, y: box.y + 60 }
  await dragMouse(page, start, { x: start.x + delta.x, y: start.y + delta.y })
}

/** Drags a note onto the trash strip and releases. */
export async function dragNoteToTrash(page: Page, index = 0): Promise<void> {
  const note = await page.locator('.note').nth(index).boundingBox()
  const trash = await page.locator('.trash').boundingBox()
  if (!note || !trash) {
    throw new Error('the note or the trash strip is not visible')
  }
  const start = { x: note.x + note.width / 2, y: note.y + 60 }
  await dragMouse(page, start, {
    x: trash.x + trash.width / 2,
    y: trash.y + trash.height / 2,
  })
}

/** Cmd on macOS, Ctrl everywhere else. */
export const SAVE_MODIFIER = process.platform === 'darwin' ? 'Meta' : 'Control'
