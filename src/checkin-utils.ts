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

export function normalizeWebsiteUrl(value: string): string {
  const candidate = value.trim()
  if (!candidate) throw new Error('请输入网站地址')
  if (/^[a-z][a-z\d+.-]*:/i.test(candidate) && !/^https?:\/\//i.test(candidate)) throw new Error('只支持 HTTP 或 HTTPS 网站')
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
  const url = new URL(withProtocol)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('只支持 HTTP 或 HTTPS 网站')
  return url.toString()
}
