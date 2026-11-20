import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
// The assessment's minimum resolution; both projects run at it.
const VIEWPORT = { width: 1024, height: 768 }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: VIEWPORT,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: VIEWPORT } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: VIEWPORT } },
  ],
  // The suite runs against the production build: the bundle the reviewer ships,
  // not the dev server.
  webServer: {
    command: `bun run build && bun run preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
