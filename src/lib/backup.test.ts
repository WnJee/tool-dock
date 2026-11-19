import { describe, expect, it } from 'vitest'
import { createWorkspaceBackup, parseWorkspaceBackup } from './backup'

describe('workspace backup', () => {
  const data = {
    theme: 'dark' as const,
    active: { type: 'site' as const, id: 'custom-one' },
    favorites: ['tool:crypto', 'site:custom-one'],
    recent: ['site:custom-one'],
    customSites: [{ id: 'custom-one', name: 'Example', description: 'Docs', url: 'https://example.com/', color: '#55caa3', initials: 'EX' }],
    checkins: {
      sites: [{ id: 'check-one', name: 'Check', url: 'https://example.com/checkin', note: 'Daily' }],
      completion: { date: '2026-08-18', ids: ['check-one'] },
    },
  }

  it('round-trips every persisted workspace field', () => {
    const backup = createWorkspaceBackup(data)
    expect(parseWorkspaceBackup(JSON.stringify(backup)).data).toEqual(data)
  })

  it('rejects previous and unrelated backup formats', () => {
    expect(() => parseWorkspaceBackup('{"kind":"tool-dock-checkins","version":2,"sites":[]}')).toThrow('全站备份')
    expect(() => parseWorkspaceBackup('{"kind":"tool-dock-backup","version":0,"data":{}}')).toThrow('全站备份')
  })
})
