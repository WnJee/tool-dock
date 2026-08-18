import { useMemo, type RefObject } from 'react'
import { CalendarCheck2, ExternalLink, Film, Search, Tv, X } from 'lucide-react'
import { TOOLS } from '../config/catalog'
import type { ActiveView, SiteDefinition } from '../types'

interface CommandPaletteProps {
  query: string
  searchRef: RefObject<HTMLInputElement | null>
  onQuery: (value: string) => void
  onClose: () => void
  onNavigate: (view: ActiveView) => void
  sites: SiteDefinition[]
}

export default function CommandPalette({ query, searchRef, sites, onQuery, onClose, onNavigate }: CommandPaletteProps) {
  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const items = [
      { key: 'checkin', name: '每日签到', description: '记录并提醒每天需要签到的网站', label: '日常', icon: CalendarCheck2, view: { type: 'checkin' } as ActiveView, keywords: '每日签到 签到 提醒 网站' },
      { key: 'movies', name: '影片库', description: '搜索和筛选 TMDB 完整电影目录', label: '日常', icon: Film, view: { type: 'movies' } as ActiveView, keywords: '影片库 电影 豆瓣 TMDB 演员 导演 评分' },
      { key: 'tv', name: '电视剧', description: '搜索和筛选 TMDB 电视剧目录', label: '日常', icon: Tv, view: { type: 'tv' } as ActiveView, keywords: '电视剧 剧集 电视 豆瓣 TMDB 演员 导演 评分' },
      ...TOOLS.map((tool) => ({ key: `tool:${tool.id}`, name: tool.name, description: tool.description, label: '工具', icon: tool.icon, view: { type: 'tool', id: tool.id } as ActiveView, keywords: `${tool.name} ${tool.description} ${tool.id === 'crypto' ? 'Base64 Base64URL Base58 Base32 Hex MD5 SHA-1 SHA-256 SHA-512 AES ChaCha20 SM4 加密 解密 哈希' : ''} ${tool.id === 'json' ? 'JSON XML HTML JavaScript JS YAML Properties 格式化 压缩 转义 反转义 互转' : ''} ${tool.id === 'random' ? '随机 测试数据 国内收货地址 美国账单地址 用户 邮箱 手机号 密码 正则' : ''}` })),
      ...sites.map((site) => ({ key: `site:${site.id}`, name: site.name, description: site.description, label: '网站', icon: ExternalLink, view: { type: 'site', id: site.id } as ActiveView, keywords: `${site.name} ${site.description} ${site.url}` })),
    ]
    return keyword ? items.filter((item) => item.keywords.toLowerCase().includes(keyword)) : items
  }, [query, sites])

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-input"><Search size={20} /><input ref={searchRef} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜索 AES、Base64、JSON、IP…" /><button onClick={onClose}><X size={17} /></button></div>
        <div className="palette-results">
          <div className="palette-label">{query ? `搜索结果 · ${results.length}` : '全部内容'}</div>
          {results.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => onNavigate(item.view)}><span className="result-icon"><Icon size={18} /></span><span><strong>{item.name}</strong><small>{item.description}</small></span><em>{item.label}</em></button> })}
          {results.length === 0 && <div className="empty-state">没有找到匹配内容</div>}
        </div>
        <div className="palette-footer"><span><kbd>ESC</kbd> 关闭</span><span>编码与格式化工具在本地运行</span></div>
      </div>
    </div>
  )
}
