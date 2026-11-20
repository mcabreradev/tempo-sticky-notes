#!/usr/bin/env node
/**
 * Regenerates the media in docs/ from the real production build.
 *
 *   bun run build && bun run preview --port 4180   # in another terminal
 *   bun run docs:shots                            # the two screenshots
 *   bun run docs:demo                             # docs/demo.gif (needs ffmpeg)
 *
 * BASE_URL overrides the address the script talks to.
 */
import { chromium } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const TMP = resolve('node_modules/.tmp/doc-assets')
const THEME_KEY = 'sticky-notes-theme-v1'
const BOARD_KEY = 'sticky-notes-board-v1'

// A board that is already in use: the media shows the app working, not an empty canvas.
const BOARD_SEED = [
  { id: 'a', x: 84, y: 56, width: 300, height: 190, color: 'yellow', zIndex: 1, text: 'Sketch the week' },
  { id: 'b', x: 430, y: 48, width: 280, height: 170, color: 'green', zIndex: 2, text: 'Ship on Friday' },
  { id: 'c', x: 760, y: 70, width: 290, height: 200, color: 'blue', zIndex: 3, text: 'Ask design for the cork' },
  { id: 'd', x: 220, y: 300, width: 300, height: 180, color: 'pink', zIndex: 4, text: 'Review the reducer' },
  { id: 'e', x: 620, y: 290, width: 280, height: 190, color: 'purple', zIndex: 5, text: 'Pick a colour from the swatches' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function requireTool(command, args, hint) {
  const probe = spawnSync(command, args, { encoding: 'utf8' })
  if (probe.error) {
    console.error(`${command} is required: ${hint}`)
    process.exit(1)
  }
}

async function requireServer() {
  try {
    const response = await fetch(BASE, { signal: AbortSignal.timeout(2000) })
    if (!response.ok) throw new Error(String(response.status))
  } catch {
    console.error(`No server at ${BASE}.`)
    console.error('Start one with:  bun run build && bun run preview --port 4180')
    process.exit(1)
  }
}

async function seed(page, theme) {
  await page.goto(BASE)
  await page.evaluate(
    ([board, key, themeKey, themeValue]) => {
      window.localStorage.setItem(key, JSON.stringify({ version: 1, notes: board }))
      window.localStorage.setItem(themeKey, themeValue)
    },
    [BOARD_SEED, BOARD_KEY, THEME_KEY, theme],
  )
  await page.reload()
  await page.getByTestId('board').waitFor()
}

async function shots() {
  requireTool('ffmpeg', ['-version'], 'brew install ffmpeg')
  await requireServer()
  mkdirSync(TMP, { recursive: true })

  const browser = await chromium.launch()
  for (const [theme, output] of [
    ['light', 'docs/sticky-notes.png'],
    ['dark', 'docs/sticky-notes-dark.png'],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: 'light',
    })
    const page = await context.newPage()
    await seed(page, theme)
    // The screenshot shows the real control doing its job, not an emulated media query.
    await page.getByTestId(`theme-${theme}`).click()
    await page.getByTestId('note').first().hover()
    await sleep(600)
    const raw = resolve(TMP, `${theme}.png`)
    await page.screenshot({ path: raw })
    const scaled = spawnSync(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-i', raw, '-vf', 'scale=1000:-1:flags=lanczos', output],
      { encoding: 'utf8' },
    )
    if (scaled.status !== 0) {
      console.error(scaled.stderr)
      process.exit(1)
    }
    console.log(output)
    await context.close()
  }
  await browser.close()
}

async function demo() {
  requireTool('ffmpeg', ['-version'], 'brew install ffmpeg')
  await requireServer()
  rmSync(TMP, { recursive: true, force: true })
  mkdirSync(resolve(TMP, 'video'), { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: resolve(TMP, 'video'), size: { width: 1280, height: 800 } },
    colorScheme: 'light',
  })
  const page = await context.newPage()
  // System, so the recording opens on the default and then shows both overrides.
  await seed(page, 'system')
  await sleep(800)

  const board = await page.getByTestId('board').boundingBox()
  const noteByText = (text) => page.getByRole('group', { name: new RegExp(text) })
  const drag = async (from, to, steps = 24) => {
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps })
    await page.mouse.up()
    await sleep(220)
  }

  // Edit, move, resize, recolour one note.
  const note = noteByText('Sketch the week')
  await note.getByTestId('note-body').dblclick()
  await page.getByTestId('note-editor').fill('Sketch the week and the API')
  await page.keyboard.press('Meta+Enter')
  await sleep(500)

  const box = await note.boundingBox()
  await drag(
    { x: box.x + box.width / 2, y: box.y + 50 },
    { x: box.x + box.width / 2 + 70, y: box.y + 50 + 120 },
  )
  await sleep(400)

  const handle = await note.getByTestId('note-resize').boundingBox()
  await drag({ x: handle.x + 8, y: handle.y + 8 }, { x: handle.x + 90, y: handle.y + 60 })
  await sleep(400)

  await note.hover()
  await note.getByTestId('note-color-orange').click()
  await sleep(450)

  // Draw a new note and write in it from the keyboard.
  await drag({ x: board.x + 1060, y: board.y + 330 }, { x: board.x + 1240, y: board.y + 470 })
  await sleep(500)
  await page.keyboard.press('Enter')
  await page.getByTestId('note-editor').fill('Draw to create')
  await page.keyboard.press('Meta+Enter')
  await sleep(500)

  // Throw one into the bin, then undo.
  const victim = await noteByText('Review the reducer').boundingBox()
  const trash = await page.getByTestId('trash').boundingBox()
  await drag(
    { x: victim.x + victim.width / 2, y: victim.y + 50 },
    { x: trash.x + trash.width / 2, y: trash.y + trash.height / 2 },
    28,
  )
  await sleep(850)
  await page.getByTestId('undo-action').click()
  await sleep(1000)

  // Keyboard: nudge and grow the same note.
  await note.click()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Shift+ArrowDown')
  await sleep(900)

  // The theme control: the palette repaint is the point, so hold each state.
  await page.getByTestId('theme-dark').click()
  await sleep(1500)
  await page.getByTestId('theme-light').click()
  await sleep(1100)

  await context.close()
  await browser.close()

  const webm = readdirSync(resolve(TMP, 'video')).find((file) => file.endsWith('.webm'))
  if (!webm) {
    console.error('the recording produced no video')
    process.exit(1)
  }
  const encoded = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-i',
      resolve(TMP, 'video', webm),
      '-vf',
      // 12 fps at 820 px with a 96-colour palette: readable on GitHub, ~2 MB.
      'fps=12,scale=820:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4',
      '-loop',
      '0',
      'docs/demo.gif',
    ],
    { encoding: 'utf8' },
  )
  if (encoded.status !== 0) {
    console.error(encoded.stderr)
    process.exit(1)
  }
  console.log('docs/demo.gif')
}

const command = process.argv[2]
const commands = { demo, shots }
const run = commands[command]
if (!run) {
  console.error(`Usage: node scripts/doc-assets.mjs <${Object.keys(commands).join('|')}>`)
  process.exit(1)
}
await run()
