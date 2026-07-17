import { useMemo, type RefObject } from 'react'
import { CalendarCheck2, ExternalLink, Search, X } from 'lucide-react'
import { SITES, TOOLS } from '../config/catalog'
import type { ActiveView } from '../types'

interface CommandPaletteProps {
  query: string
  searchRef: RefObject<HTMLInputElement | null>
  onQuery: (value: string) => void
  onClose: () => void
  onNavigate: (view: ActiveView) => void
}

export default function CommandPalette({ query, searchRef, onQuery, onClose, onNavigate }: CommandPaletteProps) {
  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const items = [
      { key: 'checkin', name: '每日签到', description: '记录并提醒每天需要签到的网站', label: '日常', icon: CalendarCheck2, view: { type: 'checkin' } as ActiveView, keywords: '每日签到 签到 提醒 网站' },
      ...TOOLS.map((tool) => ({ key: `tool:${tool.id}`, name: tool.name, description: tool.description, label: '工具', icon: tool.icon, view: { type: 'tool', id: tool.id } as ActiveView, keywords: `${tool.name} ${tool.description}` })),
      ...SITES.map((site) => ({ key: `site:${site.id}`, name: site.name, description: site.description, label: '网站', icon: ExternalLink, view: { type: 'site', id: site.id } as ActiveView, keywords: `${site.name} ${site.description} ${site.url}` })),
    ]
    return keyword ? items.filter((item) => item.keywords.toLowerCase().includes(keyword)) : items
  }, [query])

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-input"><Search size={20} /><input ref={searchRef} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜索 Base64、JSON、IP、Codex…" /><button onClick={onClose}><X size={17} /></button></div>
        <div className="palette-results">
          <div className="palette-label">{query ? `搜索结果 · ${results.length}` : '全部内容'}</div>
          {results.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => onNavigate(item.view)}><span className="result-icon"><Icon size={18} /></span><span><strong>{item.name}</strong><small>{item.description}</small></span><em>{item.label}</em></button> })}
          {results.length === 0 && <div className="empty-state">没有找到匹配内容</div>}
        </div>
        <div className="palette-footer"><span><kbd>ESC</kbd> 关闭</span><span>所有工具均在本地运行</span></div>
      </div>
    </div>
  )
}
