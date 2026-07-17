import { Braces, Sparkles, Star } from 'lucide-react'
import { resolveCatalogName, SITES, TOOLS } from '../config/catalog'
import type { ActiveView, SiteDefinition, ToolDefinition, ToolId } from '../types'

interface DashboardPageProps {
  favorites: string[]
  recent: string[]
  onNavigate: (view: ActiveView) => void
  onFavorite: (key: string) => void
}

export default function DashboardPage({ favorites, recent, onNavigate, onFavorite }: DashboardPageProps) {
  function openKey(key: string) {
    const [type, id] = key.split(':')
    if (type === 'tool') onNavigate({ type: 'tool', id: id as ToolId })
    else onNavigate({ type: 'site', id })
  }

  const favoriteItems = [
    ...TOOLS.map((item) => ({ key: `tool:${item.id}`, item, type: 'tool' as const })),
    ...SITES.map((item) => ({ key: `site:${item.id}`, item, type: 'site' as const })),
  ].filter(({ key }) => favorites.includes(key))

  return (
    <div className="dashboard page-container">
      <section className="hero">
        <div><span className="eyebrow"><Sparkles size={14} /> PERSONAL WORKSPACE</span><h1>下午好，今天想处理什么？</h1><p>常用工具与信息站点，都收在一个安静、高效的工作台里。</p></div>
        <div className="hero-orb"><Braces size={46} /></div>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><h2>快速开始</h2><p>最常用的本地工具</p></div></div>
        <div className="tool-grid">
          {TOOLS.map((tool) => { const Icon = tool.icon; return <button className="tool-card" key={tool.id} onClick={() => onNavigate({ type: 'tool', id: tool.id })}><span className="tool-icon" style={{ color: tool.color, background: `${tool.color}18` }}><Icon size={22} /></span><span className="card-content"><strong>{tool.name}</strong><small>{tool.description}</small></span><span className="arrow">→</span></button> })}
        </div>
      </section>
      <div className="dashboard-columns">
        <section className="section-block panel-block">
          <div className="section-heading"><div><h2>收藏</h2><p>固定在手边的内容</p></div></div>
          <div className="compact-list">
            {favoriteItems.map(({ key, item, type }) => <FavoriteRow key={key} itemKey={key} item={item} type={type} onOpen={openKey} onFavorite={onFavorite} />)}
          </div>
        </section>
        <section className="section-block panel-block">
          <div className="section-heading"><div><h2>最近使用</h2><p>继续刚才的工作</p></div></div>
          {recent.length === 0 ? <div className="empty-state">使用过的工具和网站会出现在这里</div> : <div className="recent-chips">{recent.map((key) => <button key={key} onClick={() => openKey(key)}>{resolveCatalogName(key)}</button>)}</div>}
        </section>
      </div>
    </div>
  )
}

interface FavoriteRowProps {
  itemKey: string
  item: ToolDefinition | SiteDefinition
  type: 'tool' | 'site'
  onOpen: (key: string) => void
  onFavorite: (key: string) => void
}

function FavoriteRow({ itemKey, item, type, onOpen, onFavorite }: FavoriteRowProps) {
  let icon
  if (type === 'tool') {
    const Icon = (item as ToolDefinition).icon
    icon = <Icon size={18} />
  } else {
    const site = item as SiteDefinition
    icon = <span className="site-mini" style={{ background: site.color }}>{site.initials}</span>
  }
  return (
    <div className="compact-row">
      <button onClick={() => onOpen(itemKey)}>{icon}<span><strong>{item.name}</strong><small>{item.description}</small></span></button>
      <button className="icon-button subtle" onClick={() => onFavorite(itemKey)} title="取消收藏"><Star size={15} fill="currentColor" /></button>
    </div>
  )
}
