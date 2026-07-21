import { describe, expect, it } from 'vitest'
import { getLocalDateKey, mergeCheckinBackup, normalizeWebsiteUrl, parseCheckinBackup } from './checkin-utils'

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

  it('parses and normalizes a ToolDock check-in backup', () => {
    const backup = parseCheckinBackup(JSON.stringify({
      kind: 'tool-dock-checkins',
      version: 1,
      exportedAt: '2026-07-21T00:00:00.000Z',
      sites: [{ id: 'one', name: ' Example ', url: 'example.com/checkin', note: ' daily ' }],
      completion: { date: '2026-07-21', ids: ['one', 'missing'] },
    }))

    expect(backup.sites).toEqual([{ id: 'one', name: 'Example', url: 'https://example.com/checkin', note: 'daily' }])
    expect(backup.completion.ids).toEqual(['one'])
  })

  it('rejects unrelated JSON files', () => {
    expect(() => parseCheckinBackup('{"sites":[]}')).toThrow('ToolDock')
  })

  it('merges sites by URL and carries over only today completion', () => {
    const backup = parseCheckinBackup(JSON.stringify({
      kind: 'tool-dock-checkins',
      version: 1,
      sites: [
        { id: 'remote-one', name: 'Updated', url: 'https://one.example', note: 'new note' },
        { id: 'remote-two', name: 'Two', url: 'https://two.example', note: '' },
      ],
      completion: { date: '2026-07-21', ids: ['remote-one', 'remote-two'] },
    }))
    const result = mergeCheckinBackup(
      [{ id: 'local-one', name: 'One', url: 'https://one.example/', note: '' }],
      { date: '2026-07-21', ids: [] },
      backup,
      '2026-07-21',
      () => 'generated',
    )

    expect(result.addedCount).toBe(1)
    expect(result.updatedCount).toBe(1)
    expect(result.sites).toEqual([
      { id: 'local-one', name: 'Updated', url: 'https://one.example/', note: 'new note' },
      { id: 'remote-two', name: 'Two', url: 'https://two.example/', note: '' },
    ])
    expect(result.completion.ids).toEqual(['local-one', 'remote-two'])
  })
})
