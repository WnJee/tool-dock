import { normalizeWebsiteUrl } from './checkin-utils'
import type { CheckinSite, DailyCompletion } from './checkin-utils'
import { createCustomSite } from './site-utils'
import type { ActiveView, SiteDefinition } from './types'

export interface WorkspaceData {
  theme: 'dark' | 'light'
  active: ActiveView
  favorites: string[]
  recent: string[]
  customSites: SiteDefinition[]
  checkins: {
    sites: CheckinSite[]
    completion: DailyCompletion
  }
}

export interface WorkspaceBackup {
  kind: 'tool-dock-backup'
  version: 1
  exportedAt: string
  data: WorkspaceData
}

export function createWorkspaceBackup(data: WorkspaceData): WorkspaceBackup {
  return { kind: 'tool-dock-backup', version: 1, exportedAt: new Date().toISOString(), data }
}

export function parseWorkspaceBackup(text: string): WorkspaceBackup {
  let input: unknown
  try {
    input = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON 格式')
  }
  if (!isRecord(input) || input.kind !== 'tool-dock-backup' || input.version !== 1 || !isRecord(input.data)) {
    throw new Error('请选择由“备份与恢复”导出的 ToolDock 全站备份文件')
  }

  const data = input.data
  if (data.theme !== 'dark' && data.theme !== 'light') throw new Error('备份中的主题设置无效')
  const active = parseActiveView(data.active)
  const favorites = parseStringArray(data.favorites, '收藏')
  const recent = parseStringArray(data.recent, '最近使用')
  const customSites = parseCustomSites(data.customSites)
  const checkins = parseCheckins(data.checkins)

  return {
    kind: 'tool-dock-backup',
    version: 1,
    exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : '',
    data: { theme: data.theme, active, favorites, recent, customSites, checkins },
  }
}

export function restoreWorkspaceBackup(backup: WorkspaceBackup, storage: Storage): void {
  const { data } = backup
  storage.setItem('tooldock.theme', JSON.stringify(data.theme))
  storage.setItem('tooldock.active', JSON.stringify(data.active))
  storage.setItem('tooldock.favorites', JSON.stringify(data.favorites))
  storage.setItem('tooldock.recent', JSON.stringify(data.recent))
  storage.setItem('tooldock.custom-sites', JSON.stringify(data.customSites))
  storage.setItem('tooldock.checkins.sites', JSON.stringify(data.checkins.sites))
  storage.setItem('tooldock.checkins.completion', JSON.stringify(data.checkins.completion))
}

function parseActiveView(value: unknown): ActiveView {
  if (!isRecord(value) || typeof value.type !== 'string') throw new Error('备份中的当前页面无效')
  if (value.type === 'home' || value.type === 'checkin' || value.type === 'movies' || value.type === 'tv') return { type: value.type }
  if (value.type === 'tool' && (value.id === 'crypto' || value.id === 'json' || value.id === 'timestamp' || value.id === 'random')) return { type: 'tool', id: value.id }
  if (value.type === 'site' && isNonEmptyString(value.id)) return { type: 'site', id: value.id.trim() }
  throw new Error('备份中的当前页面无效')
}

function parseCustomSites(value: unknown): SiteDefinition[] {
  if (!Array.isArray(value)) throw new Error('备份中的自定义常用网站无效')
  const seenIds = new Set<string>()
  return value.map((site, index) => {
    if (!isRecord(site) || !isNonEmptyString(site.id) || !isNonEmptyString(site.name) || typeof site.description !== 'string' || typeof site.url !== 'string' || typeof site.color !== 'string') {
      throw new Error(`第 ${index + 1} 个自定义常用网站的数据不完整`)
    }
    const id = site.id.trim()
    if (seenIds.has(id)) throw new Error(`备份中存在重复的自定义网站 ID：${id}`)
    seenIds.add(id)
    return createCustomSite(id, { name: site.name, description: site.description, url: site.url, color: site.color })
  })
}

function parseCheckins(value: unknown): WorkspaceData['checkins'] {
  if (!isRecord(value) || !Array.isArray(value.sites) || !isRecord(value.completion)) throw new Error('备份中的签到数据无效')
  const seenIds = new Set<string>()
  const sites = value.sites.map((site, index) => {
    if (!isRecord(site) || !isNonEmptyString(site.id) || !isNonEmptyString(site.name) || typeof site.url !== 'string' || typeof site.note !== 'string') {
      throw new Error(`第 ${index + 1} 个签到网站的数据不完整`)
    }
    const id = site.id.trim()
    if (seenIds.has(id)) throw new Error(`备份中存在重复的签到网站 ID：${id}`)
    seenIds.add(id)
    return { id, name: site.name.trim(), url: normalizeWebsiteUrl(site.url), note: site.note.trim() }
  })
  const completion = value.completion
  if (typeof completion.date !== 'string' || !Array.isArray(completion.ids)) throw new Error('备份中的签到状态无效')
  const ids = [...new Set(completion.ids.map((id) => {
    if (typeof id !== 'string') throw new Error('备份中的签到状态无效')
    return id
  }).filter((id) => seenIds.has(id)))]
  return { sites, completion: { date: completion.date, ids } }
}

function parseStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error(`备份中的${label}数据无效`)
  return [...new Set(value)]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
