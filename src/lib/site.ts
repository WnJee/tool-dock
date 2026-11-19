import type { SiteDefinition } from '../types'

export const CUSTOM_SITE_COLORS = ['#6f8cff', '#55caa3', '#8b7bea', '#eea853', '#e8799f', '#45b7d1']

export interface CustomSiteDraft {
  name: string
  description: string
  url: string
  color: string
}

export function normalizeSiteUrl(value: string): string {
  const candidate = value.trim()
  if (!candidate) throw new Error('请输入网站地址')
  if (/^[a-z][a-z\d+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) throw new Error('只支持 HTTP 或 HTTPS 网站')
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
  const url = new URL(withProtocol)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('只支持 HTTP 或 HTTPS 网站')
  return url.toString()
}

export function getSiteInitials(name: string): string {
  return [...name.trim()].slice(0, 2).join('').toUpperCase()
}

export function createCustomSite(id: string, draft: CustomSiteDraft): SiteDefinition {
  const name = draft.name.trim()
  if (!name) throw new Error('请输入网站名称')
  const color = CUSTOM_SITE_COLORS.includes(draft.color) ? draft.color : CUSTOM_SITE_COLORS[0]
  return {
    id,
    name,
    description: draft.description.trim() || '自定义常用网站',
    url: normalizeSiteUrl(draft.url),
    color,
    initials: getSiteInitials(name),
  }
}
