import { expect, test } from '@playwright/test'
import {
  boardBox,
  createNoteWithButton,
  dragMouse,
  dragNoteBy,
  dragNoteToTrash,
  noteAt,
  noteGeometry,
  notesOf,
  openEmptyBoard,
  previewOf,
  SAVE_MODIFIER,
  TRASH_STRIP_HEIGHT,
  trashOf,
} from './support'

test.beforeEach(async ({ page }) => {
  await openEmptyBoard(page)
})

test.describe('creating notes', () => {
  test('draws a note with exactly the dragged geometry', async ({ page }) => {
    const board = await boardBox(page)
    await dragMouse(
      page,
      { x: board.x + 120, y: board.y + 150 },
      { x: board.x + 360, y: board.y + 310 },
    )

    await expect(notesOf(page)).toHaveCount(1)
    expect(await noteGeometry(page)).toEqual({
      left: 120,
      top: 150,
      width: 240,
      height: 160,
    })
  })

  test('shows a preview while drawing and clears it after the drop', async ({ page }) => {
    const board = await boardBox(page)
    const start = { x: board.x + 200, y: board.y + 120 }

    await page.mouse.move(start.x, start.y)
    await page.mouse.down()
    await page.mouse.move(start.x + 130, start.y + 90, { steps: 5 })
    await expect(previewOf(page)).toBeVisible()

    await page.mouse.up()
    await expect(previewOf(page)).toHaveCount(0)
    await expect(notesOf(page)).toHaveCount(1)
  })

  test('creates a default note centred on a plain click', async ({ page }) => {
    const board = await boardBox(page)
    await page.mouse.click(board.x + 300, board.y + 200)

    await expect(notesOf(page)).toHaveCount(1)
    expect(await noteGeometry(page)).toEqual({
      left: 180,
      top: 120,
      width: 240,
      height: 160,
    })
  })

  test('places a cascading note from the toolbar', async ({ page }) => {
    await createNoteWithButton(page)
    await expect(notesOf(page)).toHaveCount(1)
    expect(await noteGeometry(page)).toEqual({
      left: 64,
      top: 64,
      width: 240,
      height: 160,
    })
  })

  test('never creates a note below the minimum size', async ({ page }) => {
    const board = await boardBox(page)
    await dragMouse(
      page,
      { x: board.x + 400, y: board.y + 300 },
      { x: board.x + 408, y: board.y + 305 },
    )

    expect(await noteGeometry(page)).toEqual({
      left: 400,
      top: 300,
      width: 120,
      height: 60,
    })
  })

  test('keeps a note inside the board when drawn past its edges', async ({ page }) => {
    const board = await boardBox(page)
    // Stay inside the viewport: Firefox does not deliver pointer events for
    // coordinates outside the window, so the drag must remain visible.
    await dragMouse(
      page,
      { x: board.x + 100, y: board.y + 10 },
      { x: board.x + 1000, y: board.y + 700 },
    )

    const note = await noteGeometry(page)
    const usableHeight = board.height - TRASH_STRIP_HEIGHT
    expect(note.left + note.width).toBeLessThanOrEqual(board.width)
    expect(note.top + note.height).toBeLessThanOrEqual(usableHeight)
    // 900x690 drawn on a 1024x638 usable board: the height is clamped and the
    // note is pushed back to the top edge to stay fully visible.
    expect(note).toEqual({ left: 100, top: 0, width: 900, height: 638 })
  })
})

test.describe('moving and resizing', () => {
  test('moves a note by the pointer delta', async ({ page }) => {
    await createNoteWithButton(page)
    await dragNoteBy(page, 0, { x: 40, y: -30 })

    expect(await noteGeometry(page)).toEqual({
      left: 104,
      top: 34,
      width: 240,
      height: 160,
    })
  })

  test('cancels a move with Escape and restores the exact position', async ({ page }) => {
    await createNoteWithButton(page)
    const box = await notesOf(page).boundingBox()
    if (!box) {
      throw new Error('the note is not visible')
    }

    await page.mouse.move(box.x + box.width / 2, box.y + 60)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 140, box.y + 60 + 90, { steps: 6 })
    await page.keyboard.press('Escape')
    await page.mouse.up()

    expect(await noteGeometry(page)).toEqual({
      left: 64,
      top: 64,
      width: 240,
      height: 160,
    })
  })

  test('resizes from the corner handle with the top-left corner anchored', async ({ page }) => {
    await createNoteWithButton(page)
    const handle = await page.getByTestId('note-resize').boundingBox()
    if (!handle) {
      throw new Error('the resize handle is not visible')
    }
    const centre = { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 }

    await dragMouse(page, centre, { x: centre.x + 60, y: centre.y + 30 })

    expect(await noteGeometry(page)).toEqual({
      left: 64,
      top: 64,
      width: 300,
      height: 190,
    })
  })
})

test.describe('deleting with the trash strip', () => {
  test('arms and highlights the trash while a note is dragged over it', async ({ page }) => {
    await createNoteWithButton(page)
    const box = await notesOf(page).boundingBox()
    const trash = await trashOf(page).boundingBox()
    if (!box || !trash) {
      throw new Error('the note or the trash strip is not visible')
    }

    await page.mouse.move(box.x + box.width / 2, box.y + 60)
    await page.mouse.down()
    await page.mouse.move(trash.x + trash.width / 2, trash.y + trash.height / 2, { steps: 8 })

    await expect(trashOf(page)).toHaveAttribute('data-state', 'danger')
    await expect(notesOf(page)).toHaveAttribute('data-over-trash', 'true')

    await page.keyboard.press('Escape')
    await page.mouse.up()
    await expect(notesOf(page)).toHaveCount(1)
  })

  test('deletes a note dropped on the trash and offers undo', async ({ page }) => {
    await createNoteWithButton(page)
    await page.getByTestId('note-body').dblclick()
    await page.getByTestId('note-editor').fill('Delete me later')
    await page.keyboard.press(`${SAVE_MODIFIER}+Enter`)

    await dragNoteToTrash(page)
    await expect(notesOf(page)).toHaveCount(0)

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(notesOf(page)).toHaveCount(1)
    await expect(page.getByTestId('note-body')).toHaveText('Delete me later')
  })

  test('keeps a note dragged out of the trash and snaps it back above the strip', async ({ page }) => {
    await createNoteWithButton(page)
    const box = await notesOf(page).boundingBox()
    const trash = await trashOf(page).boundingBox()
    if (!box || !trash) {
      throw new Error('the note or the trash strip is not visible')
    }

    await page.mouse.move(box.x + box.width / 2, box.y + 60)
    await page.mouse.down()
    await page.mouse.move(trash.x + trash.width / 2, trash.y + trash.height / 2, { steps: 8 })
    await page.mouse.move(trash.x + 300, trash.y - 220, { steps: 8 })
    await page.mouse.up()

    await expect(notesOf(page)).toHaveCount(1)
    const note = await noteGeometry(page)
    const board = await boardBox(page)
    expect(note.top + note.height).toBeLessThanOrEqual(board.height - TRASH_STRIP_HEIGHT)
  })
})

test.describe('stacking, text and colours', () => {
  test('brings a pressed note above the others', async ({ page }) => {
    await createNoteWithButton(page)
    await createNoteWithButton(page)
    await expect(notesOf(page)).toHaveCount(2)

    // Label the lower note so its identity survives the DOM re-ordering that
    // stacking changes trigger. Editing raises it, which gives the baseline.
    const lower = notesOf(page).filter({ hasText: 'lower note' })
    const upper = notesOf(page).filter({ hasNotText: 'lower note' })
    await noteAt(page).getByTestId('note-body').dblclick()
    await page.getByTestId('note-editor').fill('lower note')
    await page.keyboard.press(`${SAVE_MODIFIER}+Enter`)

    const zIndex = (locator: typeof lower) =>
      locator.evaluate((el: HTMLElement) => Number(el.style.zIndex))

    expect(await zIndex(lower)).toBeGreaterThan(await zIndex(upper))

    await upper.click({ position: { x: 20, y: 40 } })

    expect(await zIndex(upper)).toBeGreaterThan(await zIndex(lower))
  })

  test('edits text with a double click and saves with the keyboard', async ({ page }) => {
    await createNoteWithButton(page)
    await page.getByTestId('note-body').dblclick()
    await page.getByTestId('note-editor').fill('Buy oat milk')
    await page.keyboard.press(`${SAVE_MODIFIER}+Enter`)

    await expect(page.getByTestId('note-editor')).toHaveCount(0)
    await expect(page.getByTestId('note-body')).toHaveText('Buy oat milk')
  })

  test('discards the draft when Escape leaves the editor', async ({ page }) => {
    await createNoteWithButton(page)
    await page.getByTestId('note-body').dblclick()
    await page.getByTestId('note-editor').fill('discard me')
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('note-editor')).toHaveCount(0)
    await expect(page.getByTestId('note-body')).toContainText('Double-click to write')
  })

  test('recolours a note from its palette', async ({ page }) => {
    await createNoteWithButton(page)
    const note = noteAt(page)
    await expect(note).toHaveAttribute('data-color', 'yellow')

    await note.hover()
    await page.getByRole('radio', { name: 'Set note color green' }).click()

    await expect(note).toHaveAttribute('data-color', 'green')
  })
})
