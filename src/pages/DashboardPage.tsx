import { useMemo, useState } from 'react'
import { ArrowUpRight, Search, Star, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TOOLS } from '../config/catalog'
import type { ActiveView, SiteDefinition, ToolId } from '../types'

interface DashboardPageProps {
  favorites: string[]
  recent: string[]
  sites: SiteDefinition[]
  onNavigate: (view: ActiveView) => void
  onFavorite: (key: string) => void
}

type FilterId = 'all' | 'tool' | 'site' | 'favorite' | 'recent'

interface Entry {
  key: string
  name: string
  description: string
  type: 'tool' | 'site'
  color: string
  initials: string
  icon?: LucideIcon
}

export default function DashboardPage({ favorites, recent, sites, onNavigate, onFavorite }: DashboardPageProps) {
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')

  const entries = useMemo<Entry[]>(
    () => [
      ...TOOLS.map((tool) => ({
        key: `tool:${tool.id}`,
        name: tool.name,
        description: tool.description,
        type: 'tool' as const,
        color: tool.color,
        initials: '',
        icon: tool.icon,
      })),
      ...sites.map((site) => ({
        key: `site:${site.id}`,
        name: site.name,
        description: site.description,
        type: 'site' as const,
        color: site.color,
        initials: site.initials,
      })),
    ],
    [sites],
  )

  const counts = useMemo(
    () => ({
      all: entries.length,
      tool: entries.filter((entry) => entry.type === 'tool').length,
      site: entries.filter((entry) => entry.type === 'site').length,
      favorite: entries.filter((entry) => favorites.includes(entry.key)).length,
      recent: entries.filter((entry) => recent.includes(entry.key)).length,
    }),
    [entries, favorites, recent],
  )

  const tabs: { id: FilterId; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'tool', label: '工具' },
    { id: 'site', label: '网站' },
    { id: 'favorite', label: '收藏' },
    { id: 'recent', label: '最近' },
  ]

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const filtered = entries.filter((entry) => {
      if (filter === 'tool' && entry.type !== 'tool') return false
      if (filter === 'site' && entry.type !== 'site') return false
      if (filter === 'favorite' && !favorites.includes(entry.key)) return false
      if (filter === 'recent' && !recent.includes(entry.key)) return false
      if (!keyword) return true
      return entry.name.toLowerCase().includes(keyword) || entry.description.toLowerCase().includes(keyword)
    })
    if (filter === 'recent') {
      return filtered.sort((a, b) => recent.indexOf(a.key) - recent.indexOf(b.key))
    }
    return filtered
  }, [entries, favorites, filter, query, recent])

  function openKey(key: string) {
    const [type, id] = key.split(':')
    if (type === 'tool') onNavigate({ type: 'tool', id: id as ToolId })
    else onNavigate({ type: 'site', id })
  }

  return (
    <div className="dashboard page-container">
      <header className="dash-header">
        <h1>工作台</h1>
        <div className="dash-stats">
          <span>
            <b>{String(counts.tool).padStart(2, '0')}</b> 工具
          </span>
          <span>
            <b>{String(counts.site).padStart(2, '0')}</b> 网站
          </span>
          <span>
            <b>{String(counts.favorite).padStart(2, '0')}</b> 收藏
          </span>
        </div>
      </header>

      <div className="dash-controls">
        <label className="dash-search">
          <Search size={15} aria-hidden />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选工具与网站…" aria-label="筛选工具与网站" />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="清空筛选">
              <X size={13} />
            </button>
          ) : null}
        </label>
        <div className="dash-filters" role="tablist" aria-label="条目分类">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              className={filter === tab.id ? 'active' : ''}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
              <span className="dash-count">{String(counts[tab.id]).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dash-table" role="list">
        <div className="dash-table-head" aria-hidden>
          <span>名称</span>
          <span>类型</span>
          <span>最近</span>
          <span />
        </div>
        {visible.map((entry) => {
          const isFavorite = favorites.includes(entry.key)
          return (
            <div className="dash-row" key={entry.key} role="listitem">
              <button type="button" className="dash-row-main" onClick={() => openKey(entry.key)}>
                <span className="dash-row-icon" style={{ color: entry.color }}>
                  {entry.icon ? <entry.icon size={16} /> : entry.initials}
                </span>
                <span className="dash-row-text">
                  <strong>{entry.name}</strong>
                  <small>{entry.description}</small>
                </span>
              </button>
              <span className={`dash-type ${entry.type}`}>{entry.type === 'tool' ? '工具' : '网站'}</span>
              <span className={`dash-dot ${recent.includes(entry.key) ? '' : 'off'}`} aria-hidden />
              <div className="dash-row-actions">
                <button
                  type="button"
                  className={`dash-star ${isFavorite ? 'active' : ''}`}
                  onClick={() => onFavorite(entry.key)}
                  aria-label={isFavorite ? `取消收藏 ${entry.name}` : `收藏 ${entry.name}`}
                >
                  <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button type="button" className="dash-open" onClick={() => openKey(entry.key)} aria-label={`打开 ${entry.name}`}>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          )
        })}
        {visible.length === 0 && <div className="dash-empty">没有匹配条目</div>}
      </div>
    </div>
  )
}
