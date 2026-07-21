export function getLocalDateKey(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export interface CheckinSite {
  id: string
  name: string
  url: string
  note: string
}

export interface DailyCompletion {
  date: string
  ids: string[]
}

export interface CheckinBackup {
  kind: 'tool-dock-checkins'
  version: 1
  exportedAt: string
  sites: CheckinSite[]
  completion: DailyCompletion
}

export function normalizeWebsiteUrl(value: string): string {
  const candidate = value.trim()
  if (!candidate) throw new Error('请输入网站地址')
  if (/^[a-z][a-z\d+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) throw new Error('只支持 HTTP 或 HTTPS 网站')
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
  const url = new URL(withProtocol)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('只支持 HTTP 或 HTTPS 网站')
  return url.toString()
}

export function parseCheckinBackup(text: string): CheckinBackup {
  let input: unknown
  try {
    input = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON 格式')
  }

  if (!isRecord(input) || input.kind !== 'tool-dock-checkins' || input.version !== 1 || !Array.isArray(input.sites)) {
    throw new Error('请选择由 ToolDock 导出的签到备份文件')
  }

  const seenIds = new Set<string>()
  const sites = input.sites.map((value, index) => {
    if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name) || typeof value.url !== 'string' || typeof value.note !== 'string') {
      throw new Error(`第 ${index + 1} 个签到网站的数据不完整`)
    }
    const id = value.id.trim()
    if (seenIds.has(id)) throw new Error(`备份中存在重复的网站 ID：${id}`)
    seenIds.add(id)
    return { id, name: value.name.trim(), url: normalizeWebsiteUrl(value.url), note: value.note.trim() }
  })

  const rawCompletion = input.completion
  const completion = isRecord(rawCompletion) && typeof rawCompletion.date === 'string' && Array.isArray(rawCompletion.ids)
    ? {
        date: rawCompletion.date,
        ids: [...new Set(rawCompletion.ids.filter((id): id is string => typeof id === 'string' && seenIds.has(id)))],
      }
    : { date: '', ids: [] }

  return {
    kind: 'tool-dock-checkins',
    version: 1,
    exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : '',
    sites,
    completion,
  }
}

export function mergeCheckinBackup(
  currentSites: CheckinSite[],
  currentCompletion: DailyCompletion,
  backup: CheckinBackup,
  today: string,
  createId: () => string,
) {
  const sites = currentSites.map((site) => ({ ...site }))
  const siteIndexByUrl = new Map(sites.map((site, index) => [site.url, index]))
  const usedIds = new Set(sites.map((site) => site.id))
  const importedIdMap = new Map<string, string>()
  let addedCount = 0
  let updatedCount = 0

  for (const imported of backup.sites) {
    const existingIndex = siteIndexByUrl.get(imported.url)
    if (existingIndex !== undefined) {
      const existing = sites[existingIndex]
      sites[existingIndex] = { ...existing, name: imported.name, note: imported.note }
      importedIdMap.set(imported.id, existing.id)
      updatedCount += 1
      continue
    }

    let id = imported.id
    while (usedIds.has(id)) id = createId()
    usedIds.add(id)
    importedIdMap.set(imported.id, id)
    siteIndexByUrl.set(imported.url, sites.length)
    sites.push({ ...imported, id })
    addedCount += 1
  }

  const completionIds = new Set(currentCompletion.date === today ? currentCompletion.ids : [])
  if (backup.completion.date === today) {
    backup.completion.ids.forEach((id) => {
      const mappedId = importedIdMap.get(id)
      if (mappedId) completionIds.add(mappedId)
    })
  }

  return {
    sites,
    completion: { date: today, ids: [...completionIds].filter((id) => usedIds.has(id)) },
    addedCount,
    updatedCount,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
