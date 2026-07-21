import { Braces, Clock3, Code2, Link2, Zap } from 'lucide-react'
import type { ActiveView, SiteDefinition, ToolDefinition } from '../types'

export const TOOLS: ToolDefinition[] = [
  { id: 'base64', name: 'Base64', description: 'Unicode 安全的编码与解码', icon: Code2, color: '#6f8cff', placeholder: '输入任意文本，支持中文和 Emoji…' },
  { id: 'base58', name: 'Base58', description: '无歧义字符的编码与解码', icon: Zap, color: '#eea853', placeholder: '输入要编码或解码的内容…' },
  { id: 'json', name: 'JSON 格式化', description: '美化、压缩与语法校验', icon: Braces, color: '#55caa3', placeholder: '{"name":"ToolDock","ready":true}' },
  { id: 'url', name: 'URL 编解码', description: '处理查询参数与特殊字符', icon: Link2, color: '#df7dab', placeholder: '输入 URL 或待编码文本…' },
  { id: 'timestamp', name: '时间戳转换', description: '秒、毫秒和日期互转', icon: Clock3, color: '#8b7bea', placeholder: '例如：1721203200、2026-07-17 12:00:00' },
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
  if (view.type === 'tool') return TOOLS.find((tool) => tool.id === view.id)?.name ?? '工具'
  return SITES.find((site) => site.id === view.id)?.name ?? '网站'
}

export function getActiveKey(view: ActiveView): string {
  if (view.type === 'home' || view.type === 'checkin' || view.type === 'movies') return view.type
  return `${view.type}:${view.id}`
}

export function resolveCatalogName(key: string): string | undefined {
  const [type, id] = key.split(':')
  if (type === 'tool') return TOOLS.find((tool) => tool.id === id)?.name
  return SITES.find((site) => site.id === id)?.name
}
