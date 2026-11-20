/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postcss from 'postcss'
import type { Declaration, Rule } from 'postcss'
import { describe, expect, it } from 'vitest'
import { NOTE_COLORS } from './domain/note'

// Read straight from disk: Vitest stubs CSS imports (even ?raw) to '', so the
// file itself is the only trustworthy source. Parsed with PostCSS rather than
// regexes, so the assertions talk about rules and declarations instead of the
// exact formatting of the sheet.
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const root = postcss.parse(css)

function ruleFor(selector: string): Rule | undefined {
  let found: Rule | undefined
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) {
      found = rule
    }
  })
  return found
}

function declaration(rule: Rule | undefined, prop: string): Declaration | undefined {
  let found: Declaration | undefined
  rule?.walkDecls(prop, (decl) => {
    found = decl
  })
  return found
}

// Guard: `&--modifier` is Sass syntax, not valid native CSS nesting. Browsers
// silently drop such rules, which once made every note render transparent in
// the real browser while jsdom-based tests stayed green.
describe('index.css', () => {
  it('parses as valid CSS', () => {
    expect(() => postcss.parse(css)).not.toThrow()
  })

  it('never uses Sass-style & concatenation', () => {
    const offenders: string[] = []
    root.walkRules((rule) => {
      if (/&[-_]/.test(rule.selector)) {
        offenders.push(rule.selector)
      }
    })
    expect(offenders).toEqual([])
  })

  it('styles every colour the domain can produce', () => {
    for (const color of NOTE_COLORS) {
      const note = ruleFor(`.note--${color}`)
      expect(note, `.note--${color} is missing`).toBeDefined()
      expect(declaration(note, 'background')?.value).toBeTruthy()

      const dot = ruleFor(`.note__dot--${color}`)
      expect(dot, `.note__dot--${color} is missing`).toBeDefined()
      expect(declaration(dot, 'background')?.value).toBeTruthy()
    }
  })

  it('declares the trash strip height once, in the stylesheet', () => {
    // The board measures this element instead of duplicating the number in
    // TypeScript, so the stylesheet is the only place it may appear.
    const heights: string[] = []
    root.walkRules((rule) => {
      if (rule.selector === '.trash') {
        const decl = declaration(rule, 'height')
        if (decl) {
          heights.push(decl.value)
        }
      }
    })
    expect(heights).toEqual(['72px'])
  })

  it('keeps the New note button readable on its pastel background', () => {
    // Regression: the button used --chrome-text, which turns light in dark
    // mode, leaving cream text on a pale yellow background.
    const color = declaration(ruleFor('.toolbar__new'), 'color')?.value
    expect(color).toBe('var(--note-ink)')
  })

  it('ships the visually-hidden utility the live region depends on', () => {
    const srOnly = ruleFor('.sr-only')
    expect(srOnly).toBeDefined()
    expect(declaration(srOnly, 'position')?.value).toBe('absolute')
    expect(declaration(srOnly, 'clip-path')?.value).toContain('inset')
  })

  it('styles the crash screen rendered by the error boundary', () => {
    expect(ruleFor('.crash')).toBeDefined()
    expect(ruleFor('.crash__reload')).toBeDefined()
  })
})
