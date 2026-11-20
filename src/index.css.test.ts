/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Read straight from disk: Vitest stubs CSS imports (even ?raw) to '', so the
// file itself is the only trustworthy source for a stylesheet lint. Resolved
// from the repo root, which is where the test script runs.
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

// Guard: `&--modifier` is Sass syntax, not valid native CSS nesting. Browsers
// silently drop such rules, which once made every note render transparent in
// the real browser while jsdom-based tests stayed green.
describe('index.css', () => {
  it('never uses Sass-style & concatenation (invalid native nesting)', () => {
    expect(css).not.toMatch(/&--[a-z]/)
    expect(css).not.toMatch(/&__[a-z]/)
  })

  it('keeps braces balanced', () => {
    let depth = 0
    for (const char of css) {
      if (char === '{') {
        depth += 1
      }
      if (char === '}') {
        depth -= 1
      }
      expect(depth).toBeGreaterThanOrEqual(0)
    }
    expect(depth).toBe(0)
  })

  it('defines a background for every note color variant', () => {
    for (const color of ['yellow', 'green', 'blue', 'pink', 'purple', 'orange']) {
      expect(css).toMatch(new RegExp(`\\.note--${color}\\s*\\{[^}]*background`))
    }
  })
})
