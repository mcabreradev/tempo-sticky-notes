import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
// The assessment's minimum resolution; every project runs at it.
const VIEWPORT = { width: 1024, height: 768 }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  // Keep artifacts outside the repo: trace recording wrote into
  // test-results/ from several workers and failed on close (ENOENT).
  outputDir: 'node_modules/.tmp/playwright-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: VIEWPORT,
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: VIEWPORT } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: VIEWPORT } },
    // WebKit is the engine that motivated the blocked-storage guard: Safari in
    // private mode throws on `window.localStorage` itself.
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: VIEWPORT } },
    // Edge is named by the assessment and is Chromium-based, but "same engine"
    // is an argument, not a test. It runs the same suite from the installed
    // browser (brew install --cask microsoft-edge) and is opt-in, so a machine
    // without Edge can still run the default three: `bun run test:e2e:edge`.
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: VIEWPORT },
    },
  ].filter((project) => project.name !== 'edge' || process.env.E2E_EDGE === '1'),
  // The suite runs against the production build: the bundle the reviewer ships,
  // not the dev server.
  webServer: {
    command: `bun run build && bun run preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Never reuse a server: a stale preview from another checkout silently
    // serves a different build and the failures look like product bugs.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
