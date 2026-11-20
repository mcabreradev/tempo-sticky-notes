/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// The Content-Security-Policy pins the one inline script the app ships (the
// pre-paint theme snippet) by hash, which is stricter than 'unsafe-inline' but
// breaks silently the moment that snippet changes. This test is the guard.
interface VercelConfig {
  headers: Array<{
    source: string
    headers: Array<{ key: string; value: string }>
  }>
}

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
const config = JSON.parse(
  readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'),
) as VercelConfig

function inlineThemeScript(): string {
  const match = /<script>([\s\S]*?)<\/script>/.exec(html)
  if (!match?.[1]) {
    throw new Error('index.html has no inline script to pin')
  }
  return match[1]
}

function contentSecurityPolicy(): string {
  const entry = config.headers.find((candidate) => candidate.source === '/(.*)')
  const header = entry?.headers.find(
    (candidate) => candidate.key === 'Content-Security-Policy',
  )
  if (!header) {
    throw new Error('vercel.json sets no Content-Security-Policy')
  }
  return header.value
}

describe('deployment security headers', () => {
  it('pins the inline theme script by hash instead of allowing any inline script', () => {
    const digest = createHash('sha256').update(inlineThemeScript(), 'utf8').digest('base64')
    const policy = contentSecurityPolicy()

    expect(policy).toContain(`'sha256-${digest}'`)
    expect(policy).toMatch(/script-src 'self' 'sha256-[^']+';/)
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'")
  })

  it('keeps the directives that make the policy worth having', () => {
    const policy = contentSecurityPolicy()
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
    ]) {
      expect(policy).toContain(directive)
    }
  })

  it('disables what the board does not use', () => {
    const entry = config.headers.find((candidate) => candidate.source === '/(.*)')
    const permissions = entry?.headers.find(
      (candidate) => candidate.key === 'Permissions-Policy',
    )
    expect(permissions?.value).toContain('camera=()')
    expect(permissions?.value).toContain('geolocation=()')
  })
})
