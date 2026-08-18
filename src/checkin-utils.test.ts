import { describe, expect, it } from 'vitest'
import { getLocalDateKey, normalizeWebsiteUrl } from './checkin-utils'

describe('check-in helpers', () => {
  it('normalizes common website addresses', () => {
    expect(normalizeWebsiteUrl('example.com/path')).toBe('https://example.com/path')
    expect(normalizeWebsiteUrl('http://example.com')).toBe('http://example.com/')
  })

  it('rejects unsupported protocols', () => {
    expect(() => normalizeWebsiteUrl('javascript:alert(1)')).toThrow()
  })

  it('creates a local date key', () => {
    expect(getLocalDateKey(new Date(2026, 6, 17, 23, 59))).toBe('2026-07-17')
  })
})
