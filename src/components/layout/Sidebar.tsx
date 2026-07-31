import { CalendarCheck2, Film, Home, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck, Sparkles, Star, Tv } from 'lucide-react'
import { getActiveKey, SITES, TOOLS } from '../../config/catalog'
import type { ActiveView } from '../../types'

interface SidebarProps {
  active: ActiveView
  collapsed: boolean
  favorites: string[]
  onCollapse: () => void
  onNavigate: (view: ActiveView) => void
  onSearch: () => void
}

export default function Sidebar({ active, collapsed, favorites, onCollapse, onNavigate, onSearch }: SidebarProps) {
  const activeKey = getActiveKey(active)
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <button className="brand" onClick={() => onNavigate({ type: 'home' })} aria-label="回到首页">
          <span className="brand-mark"><Sparkles size={17} /></span>
          {!collapsed && <span>ToolDock</span>}
        </button>
        <button className="icon-button subtle collapse-button" onClick={onCollapse} title={collapsed ? '展开侧栏' : '收起侧栏'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <button className="search-trigger" onClick={onSearch}>
        <Search size={17} />
        {!collapsed && <><span>搜索工具与网站</span><kbd>⌘ K</kbd></>}
      </button>
      <nav className="nav-scroll">
        <NavItem label="首页" icon={Home} active={activeKey === 'home'} collapsed={collapsed} onClick={() => onNavigate({ type: 'home' })} />
        {!collapsed && <div className="nav-label">日常</div>}
        <NavItem label="每日签到" icon={CalendarCheck2} active={activeKey === 'checkin'} collapsed={collapsed} onClick={() => onNavigate({ type: 'checkin' })} />
        <NavItem label="影片库" icon={Film} active={activeKey === 'movies'} collapsed={collapsed} onClick={() => onNavigate({ type: 'movies' })} />
        <NavItem label="电视剧" icon={Tv} active={activeKey === 'tv'} collapsed={collapsed} onClick={() => onNavigate({ type: 'tv' })} />
        {!collapsed && <div className="nav-label">常用工具</div>}
        {TOOLS.map((tool) => <NavItem key={tool.id} label={tool.name} icon={tool.icon} active={activeKey === `tool:${tool.id}`} collapsed={collapsed} favorite={favorites.includes(`tool:${tool.id}`)} onClick={() => onNavigate({ type: 'tool', id: tool.id })} />)}
        {!collapsed && <div className="nav-label site-label">常用网站</div>}
        {SITES.map((site) => (
          <button key={site.id} className={`nav-item ${activeKey === `site:${site.id}` ? 'active' : ''}`} onClick={() => onNavigate({ type: 'site', id: site.id })} title={site.name}>
            <span className="site-mini" style={{ background: site.color }}>{site.initials}</span>
            {!collapsed && <><span>{site.name}</span>{favorites.includes(`site:${site.id}`) && <Star size={12} fill="currentColor" />}</>}
          </button>
        ))}
      </nav>
      <div className="privacy-note" title="编码与格式化工具在本地浏览器运行">
        <ShieldCheck size={17} />
        {!collapsed && <div><strong>隐私优先</strong><span>工具内容本地处理</span></div>}
      </div>
    </aside>
  )
}

interface NavItemProps {
  label: string
  icon: typeof Home
  active: boolean
  collapsed: boolean
  favorite?: boolean
  onClick: () => void
}

function NavItem({ label, icon: Icon, active, collapsed, favorite, onClick }: NavItemProps) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      <Icon size={18} />
      {!collapsed && <><span>{label}</span>{favorite && <Star size={12} fill="currentColor" />}</>}
    </button>
  )
}
