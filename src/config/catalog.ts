import { Braces, Clock3, KeyRound } from 'lucide-react'
import type { ActiveView, SiteDefinition, ToolDefinition } from '../types'

export const TOOLS: ToolDefinition[] = [
  { id: 'crypto', name: '编码与加密', description: 'Base 编码、哈希摘要与 AES 加解密', icon: KeyRound, color: '#6f8cff', placeholder: '输入任意文本，支持中文和 Emoji…' },
  { id: 'json', name: '代码格式化', description: 'JSON、XML、HTML 与 JavaScript', icon: Braces, color: '#55caa3', placeholder: '{"name":"ToolDock","ready":true}' },
  { id: 'timestamp', name: '时间戳转换', description: '秒、毫秒、微秒与日期互转', icon: Clock3, color: '#8b7bea', placeholder: '例如：1721203200、2026-07-17 12:00:00' },
]

export const SITES: SiteDefinition[] = [
  {
    id: 'codex-radar',
    name: 'Codex 模型雷达',
    description: '查看 Codex 模型强度与评分',
    url: 'https://codex-reset-radar.pages.dev/#model-ratings',
    color: '#84a7ff',
    initials: 'CR',
  },
  {
    id: 'ip-check',
    name: 'IPPure',
    description: '查看公网 IP、网络位置与纯净度',
    url: 'https://ippure.com/',
    color: '#55caa3',
    initials: 'IP',
  },
]

export function getViewTitle(view: ActiveView): string {
  if (view.type === 'home') return '工作台'
  if (view.type === 'checkin') return '每日签到'
  if (view.type === 'movies') return '影片库'
  if (view.type === 'tv') return '电视剧'
  if (view.type === 'tool') return TOOLS.find((tool) => tool.id === view.id)?.name ?? '工具'
  return SITES.find((site) => site.id === view.id)?.name ?? '网站'
}

export function getActiveKey(view: ActiveView): string {
  if (view.type === 'home' || view.type === 'checkin' || view.type === 'movies' || view.type === 'tv') return view.type
  return `${view.type}:${view.id}`
}

export function resolveCatalogName(key: string): string | undefined {
  const [type, id] = key.split(':')
  if (type === 'tool') return TOOLS.find((tool) => tool.id === id)?.name
  return SITES.find((site) => site.id === id)?.name
}
