import { expect, test } from '@playwright/test'
import { createNoteWithButton, noteAt, openEmptyBoard } from './support'

// A touch screen has no hover: the palette is the only way to recolour, so it
// must be visible without one (see the `@media (hover: none)` rule).
test.use({ hasTouch: true })

test.beforeEach(async ({ page }) => {
  await openEmptyBoard(page)
})

test('keeps the colour palette reachable without a hover', async ({ page }) => {
  await createNoteWithButton(page)

  const palette = page.getByRole('radiogroup', { name: 'Note color' })
  await expect(palette).toBeVisible()

  await page.getByTestId('note-color-blue').click()
  await expect(noteAt(page)).toHaveAttribute('data-color', 'blue')
})
