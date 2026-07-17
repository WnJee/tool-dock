import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  Braces,
  Check,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  Home,
  Link2,
  Maximize2,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import type { ActiveView, SiteDefinition, ToolDefinition, ToolId } from './types'
import CheckinPage from './CheckinPage'
import {
  decodeBase58,
  decodeBase64,
  encodeBase58,
  encodeBase64,
  formatJson,
  formatTimestamp,
  minifyJson,
} from './utils'

const tools: ToolDefinition[] = [
  { id: 'base64', name: 'Base64', description: 'Unicode 安全的编码与解码', icon: Code2, color: '#6f8cff', placeholder: '输入任意文本，支持中文和 Emoji…' },
  { id: 'base58', name: 'Base58', description: '无歧义字符的编码与解码', icon: Zap, color: '#eea853', placeholder: '输入要编码或解码的内容…' },
  { id: 'json', name: 'JSON 格式化', description: '美化、压缩与语法校验', icon: Braces, color: '#55caa3', placeholder: '{"name":"ToolDock","ready":true}' },
  { id: 'url', name: 'URL 编解码', description: '处理查询参数与特殊字符', icon: Link2, color: '#df7dab', placeholder: '输入 URL 或待编码文本…' },
  { id: 'timestamp', name: '时间戳转换', description: '秒、毫秒和日期互转', icon: Clock3, color: '#8b7bea', placeholder: '例如：1721203200、2026-07-17 12:00:00' },
]

const sites: SiteDefinition[] = [
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

const getStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [active, setActive] = useState<ActiveView>(() => getStored('tooldock.active', { type: 'home' }))
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => getStored('tooldock.favorites', ['tool:base64', 'tool:json', 'site:codex-radar']))
  const [recent, setRecent] = useState<string[]>(() => getStored('tooldock.recent', []))
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStored('tooldock.theme', 'dark'))
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('tooldock.theme', JSON.stringify(theme))
  }, [theme])

  useEffect(() => {
    localStorage.setItem('tooldock.active', JSON.stringify(active))
  }, [active])

  useEffect(() => {
    localStorage.setItem('tooldock.favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        window.setTimeout(() => searchRef.current?.focus(), 20)
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const navigate = (next: ActiveView) => {
    setActive(next)
    if (next.type === 'tool' || next.type === 'site') {
      const key = `${next.type}:${next.id}`
      setRecent((current) => {
        const updated = [key, ...current.filter((item) => item !== key)].slice(0, 6)
        localStorage.setItem('tooldock.recent', JSON.stringify(updated))
        return updated
      })
    }
    setSearchOpen(false)
    setQuery('')
  }

  const toggleFavorite = (key: string) => {
    setFavorites((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        active={active}
        collapsed={sidebarCollapsed}
        favorites={favorites}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
        onNavigate={navigate}
        onSearch={() => {
          setSearchOpen(true)
          window.setTimeout(() => searchRef.current?.focus(), 20)
        }}
      />
      <main className="main-panel">
        <TopBar active={active} theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        <div className="workspace">
          {active.type === 'home' && (
            <Dashboard favorites={favorites} recent={recent} onNavigate={navigate} onFavorite={toggleFavorite} />
          )}
          {active.type === 'checkin' && <CheckinPage />}
          {active.type === 'tool' && (
            <ToolWorkspace
              key={active.id}
              tool={tools.find((item) => item.id === active.id)!}
              favorite={favorites.includes(`tool:${active.id}`)}
              onFavorite={() => toggleFavorite(`tool:${active.id}`)}
            />
          )}
          {active.type === 'site' && (
            <SiteWorkspace
              key={active.id}
              site={sites.find((item) => item.id === active.id)!}
              favorite={favorites.includes(`site:${active.id}`)}
              onFavorite={() => toggleFavorite(`site:${active.id}`)}
            />
          )}
        </div>
      </main>
      {searchOpen && (
        <CommandPalette
          query={query}
          searchRef={searchRef}
          onQuery={setQuery}
          onClose={() => setSearchOpen(false)}
          onNavigate={navigate}
        />
      )}
    </div>
  )
}

function Sidebar({ active, collapsed, favorites, onCollapse, onNavigate, onSearch }: {
  active: ActiveView
  collapsed: boolean
  favorites: string[]
  onCollapse: () => void
  onNavigate: (view: ActiveView) => void
  onSearch: () => void
}) {
  const activeKey = active.type === 'home' || active.type === 'checkin' ? active.type : `${active.type}:${active.id}`
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
        {!collapsed && <div className="nav-label">常用工具</div>}
        {tools.map((tool) => (
          <NavItem key={tool.id} label={tool.name} icon={tool.icon} active={activeKey === `tool:${tool.id}`} collapsed={collapsed} favorite={favorites.includes(`tool:${tool.id}`)} onClick={() => onNavigate({ type: 'tool', id: tool.id })} />
        ))}
        {!collapsed && <div className="nav-label site-label">常用网站</div>}
        {sites.map((site) => (
          <button key={site.id} className={`nav-item ${activeKey === `site:${site.id}` ? 'active' : ''}`} onClick={() => onNavigate({ type: 'site', id: site.id })} title={site.name}>
            <span className="site-mini" style={{ background: site.color }}>{site.initials}</span>
            {!collapsed && <><span>{site.name}</span>{favorites.includes(`site:${site.id}`) && <Star size={12} fill="currentColor" />}</>}
          </button>
        ))}
      </nav>
      <div className="privacy-note" title="所有工具均在本地浏览器运行">
        <ShieldCheck size={17} />
        {!collapsed && <div><strong>本地处理</strong><span>内容不会上传</span></div>}
      </div>
    </aside>
  )
}

function NavItem({ label, icon: Icon, active, collapsed, favorite, onClick }: { label: string; icon: typeof Home; active: boolean; collapsed: boolean; favorite?: boolean; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      <Icon size={18} />
      {!collapsed && <><span>{label}</span>{favorite && <Star size={12} fill="currentColor" />}</>}
    </button>
  )
}

function TopBar({ active, theme, onTheme }: { active: ActiveView; theme: 'dark' | 'light'; onTheme: () => void }) {
  const title = active.type === 'home' ? '工作台' : active.type === 'checkin' ? '每日签到' : active.type === 'tool' ? tools.find((item) => item.id === active.id)?.name : sites.find((item) => item.id === active.id)?.name
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>ToolDock</span><span>/</span><strong>{title}</strong></div>
      <div className="top-actions">
        <span className="local-status"><span /> 本地运行</span>
        <button className="icon-button" onClick={onTheme} title="切换主题">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}

function Dashboard({ favorites, recent, onNavigate, onFavorite }: { favorites: string[]; recent: string[]; onNavigate: (view: ActiveView) => void; onFavorite: (key: string) => void }) {
  const openKey = (key: string) => {
    const [type, id] = key.split(':')
    onNavigate(type === 'tool' ? { type: 'tool', id: id as ToolId } : { type: 'site', id })
  }
  const favoriteItems = [...tools.map((item) => ({ key: `tool:${item.id}`, item, type: 'tool' as const })), ...sites.map((item) => ({ key: `site:${item.id}`, item, type: 'site' as const }))].filter(({ key }) => favorites.includes(key))
  return (
    <div className="dashboard">
      <section className="hero">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> PERSONAL WORKSPACE</span>
          <h1>下午好，今天想处理什么？</h1>
          <p>常用工具与信息站点，都收在一个安静、高效的工作台里。</p>
        </div>
        <div className="hero-orb"><Braces size={46} /></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><h2>快速开始</h2><p>最常用的本地工具</p></div></div>
        <div className="tool-grid">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <button className="tool-card" key={tool.id} onClick={() => onNavigate({ type: 'tool', id: tool.id })}>
                <span className="tool-icon" style={{ color: tool.color, background: `${tool.color}18` }}><Icon size={22} /></span>
                <span className="card-content"><strong>{tool.name}</strong><small>{tool.description}</small></span>
                <span className="arrow">→</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="section-block panel-block">
          <div className="section-heading"><div><h2>收藏</h2><p>固定在手边的内容</p></div></div>
          <div className="compact-list">
            {favoriteItems.map(({ key, item, type }) => (
              <div className="compact-row" key={key}>
                <button onClick={() => openKey(key)}>
                  {type === 'tool' ? (() => { const Icon = (item as ToolDefinition).icon; return <Icon size={18} /> })() : <span className="site-mini" style={{ background: (item as SiteDefinition).color }}>{(item as SiteDefinition).initials}</span>}
                  <span><strong>{item.name}</strong><small>{item.description}</small></span>
                </button>
                <button className="icon-button subtle" onClick={() => onFavorite(key)} title="取消收藏"><Star size={15} fill="currentColor" /></button>
              </div>
            ))}
          </div>
        </section>
        <section className="section-block panel-block">
          <div className="section-heading"><div><h2>最近使用</h2><p>继续刚才的工作</p></div></div>
          {recent.length === 0 ? <div className="empty-state">使用过的工具和网站会出现在这里</div> : (
            <div className="recent-chips">{recent.map((key) => <button key={key} onClick={() => openKey(key)}>{resolveName(key)}</button>)}</div>
          )}
        </section>
      </div>
    </div>
  )
}

function resolveName(key: string) {
  const [type, id] = key.split(':')
  return type === 'tool' ? tools.find((item) => item.id === id)?.name : sites.find((item) => item.id === id)?.name
}

function ToolWorkspace({ tool, favorite, onFavorite }: { tool: ToolDefinition; favorite: boolean; onFavorite: () => void }) {
  const [input, setInput] = useState(tool.id === 'json' ? '{"name":"ToolDock","private":true,"features":["Base64","Base58","JSON"]}' : '')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'encode' | 'decode' | 'format' | 'minify'>('encode')
  const [jsonView, setJsonView] = useState<'tree' | 'text'>('tree')
  const Icon = tool.icon

  useEffect(() => {
    if (tool.id === 'json') {
      setMode('format')
      setJsonView('tree')
    }
    else setMode('encode')
  }, [tool.id])

  useEffect(() => {
    if (tool.id === 'json') setJsonView(mode === 'format' ? 'tree' : 'text')
  }, [mode, tool.id])

  useEffect(() => {
    if (!input.trim()) {
      setOutput('')
      setError('')
      return
    }
    try {
      let result = ''
      if (tool.id === 'base64') result = mode === 'encode' ? encodeBase64(input) : decodeBase64(input)
      if (tool.id === 'base58') result = mode === 'encode' ? encodeBase58(input) : decodeBase58(input)
      if (tool.id === 'json') result = mode === 'minify' ? minifyJson(input) : formatJson(input)
      if (tool.id === 'url') result = mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
      if (tool.id === 'timestamp') result = formatTimestamp(input)
      setOutput(result)
      setError('')
    } catch (caught) {
      setOutput('')
      setError(caught instanceof Error ? caught.message : '处理失败，请检查输入')
    }
  }, [input, mode, tool.id])

  const copyOutput = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const swap = () => {
    if (!output) return
    setInput(output)
    if (tool.id !== 'json' && tool.id !== 'timestamp') setMode(mode === 'encode' ? 'decode' : 'encode')
  }

  const modes = tool.id === 'json' ? [['format', '格式化'], ['minify', '压缩']] : tool.id === 'timestamp' ? [] : [['encode', '编码'], ['decode', '解码']]
  return (
    <div className="content-page tool-page">
      <div className="page-heading">
        <div className="heading-main"><span className="tool-icon large" style={{ color: tool.color, background: `${tool.color}18` }}><Icon size={25} /></span><div><h1>{tool.name}</h1><p>{tool.description} · 输入内容仅在当前浏览器处理</p></div></div>
        <button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={onFavorite}><Star size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? '已收藏' : '收藏'}</button>
      </div>
      <div className="tool-toolbar">
        <div className="segmented">
          {modes.map(([value, label]) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value as typeof mode)}>{label}</button>)}
          {tool.id === 'timestamp' && <span className="single-mode">智能识别</span>}
        </div>
        <div className="toolbar-hint"><Zap size={14} /> 输入后自动处理</div>
      </div>
      <div className="editor-grid">
        <EditorPanel title="输入" value={input} placeholder={tool.placeholder} onChange={setInput} onClear={() => setInput('')} />
        <button className="swap-button" onClick={swap} disabled={!output || tool.id === 'timestamp'} title="将结果放回输入区"><ArrowLeftRight size={17} /></button>
        {tool.id === 'json' && mode === 'format' && output && !error ? (
          <JsonOutputPanel value={output} view={jsonView} onView={setJsonView} onCopy={copyOutput} copied={copied} />
        ) : tool.id === 'timestamp' && output && !error ? (
          <TimestampOutputPanel value={output} onCopy={copyOutput} copied={copied} />
        ) : (
          <EditorPanel title="输出" value={output} placeholder="处理结果会实时显示在这里" readOnly error={error} onCopy={copyOutput} copied={copied} />
        )}
      </div>
      <div className="shortcut-strip"><span><kbd>⌘</kbd><kbd>K</kbd> 搜索工具</span><span>·</span><span>支持中文、Emoji 与多行文本</span><span>·</span><span className="privacy-inline"><ShieldCheck size={13} /> 本地计算</span></div>
    </div>
  )
}

function TimestampOutputPanel({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) {
  const rows = value.split('\n').map((line) => {
    const separator = line.indexOf('\t')
    return separator === -1 ? ['', line] : [line.slice(0, separator), line.slice(separator + 1)]
  })
  return (
    <div className="editor-panel timestamp-panel">
      <div className="editor-header"><span>输出</span><div><button onClick={onCopy}><CopyStatus copied={copied} /></button></div></div>
      <div className="timestamp-output">
        {rows.map(([label, rowValue]) => <div className="timestamp-row" key={label}><span>{label}</span><code>{rowValue}</code></div>)}
      </div>
      <div className="editor-footer"><span>{value.length.toLocaleString()} 字符</span></div>
    </div>
  )
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

function JsonOutputPanel({ value, view, copied, onView, onCopy }: { value: string; view: 'tree' | 'text'; copied: boolean; onView: (view: 'tree' | 'text') => void; onCopy: () => void }) {
  const parsed = useMemo(() => JSON.parse(value) as JsonValue, [value])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const expandablePaths = useMemo(() => collectExpandablePaths(parsed), [parsed])
  const togglePath = (path: string) => setCollapsed((current) => {
    const next = new Set(current)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    return next
  })
  return (
    <div className="editor-panel json-output-panel">
      <div className="editor-header json-output-header">
        <div className="output-view-tabs"><button className={view === 'tree' ? 'active' : ''} onClick={() => onView('tree')}>树形</button><button className={view === 'text' ? 'active' : ''} onClick={() => onView('text')}>文本</button></div>
        <div>
          {view === 'tree' && <><button onClick={() => setCollapsed(new Set())}><ChevronsUpDown size={14} /> 展开全部</button><button onClick={() => setCollapsed(new Set(expandablePaths))}><ChevronsDownUp size={14} /> 收起全部</button></>}
          <button onClick={onCopy}><CopyStatus copied={copied} /></button>
        </div>
      </div>
      {view === 'tree' ? <div className="json-tree"><JsonTreeNode value={parsed} path="$" collapsed={collapsed} onToggle={togglePath} /></div> : <textarea value={value} readOnly spellCheck={false} />}
      <div className="editor-footer"><span>{value.length.toLocaleString()} 字符 · {expandablePaths.length.toLocaleString()} 个可折叠层级</span></div>
    </div>
  )
}

function CopyStatus({ copied }: { copied: boolean }) {
  return <>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '已复制' : '复制'}</>
}

function isJsonContainer(value: JsonValue): value is JsonValue[] | { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object'
}

function collectExpandablePaths(value: JsonValue, path = '$'): string[] {
  if (!isJsonContainer(value)) return []
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value)
  return [path, ...entries.flatMap(([key, item]) => collectExpandablePaths(item, `${path}.${key}`))]
}

function JsonTreeNode({ value, name, path, collapsed, onToggle }: { value: JsonValue; name?: string; path: string; collapsed: Set<string>; onToggle: (path: string) => void }) {
  const prefix = name === undefined ? null : <span className="json-key">{JSON.stringify(name)}<em>:</em></span>
  if (!isJsonContainer(value)) {
    const type = value === null ? 'null' : typeof value
    return <div className="json-leaf">{prefix}<span className={`json-${type}`}>{value === null ? 'null' : typeof value === 'string' ? JSON.stringify(value) : String(value)}</span></div>
  }
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value)
  const isCollapsed = collapsed.has(path)
  const open = Array.isArray(value) ? '[' : '{'
  const close = Array.isArray(value) ? ']' : '}'
  return (
    <div className="json-branch">
      <div className="json-branch-line">
        <button aria-label={`${isCollapsed ? '展开' : '收起'} ${name ?? '根节点'}`} onClick={() => onToggle(path)}>{isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>
        {prefix}<span className="json-bracket">{open}</span>
        {isCollapsed && <><button className="json-ellipsis" onClick={() => onToggle(path)}>…</button><span className="json-count">{entries.length} 项</span><span className="json-bracket">{close}</span></>}
      </div>
      {!isCollapsed && <><div className="json-children">{entries.map(([key, item]) => <JsonTreeNode key={`${path}.${key}`} value={item} name={Array.isArray(value) ? key : key} path={`${path}.${key}`} collapsed={collapsed} onToggle={onToggle} />)}</div><div className="json-close">{close}</div></>}
    </div>
  )
}

function EditorPanel({ title, value, placeholder, readOnly, error, copied, onChange, onClear, onCopy }: { title: string; value: string; placeholder: string; readOnly?: boolean; error?: string; copied?: boolean; onChange?: (value: string) => void; onClear?: () => void; onCopy?: () => void }) {
  return (
    <div className={`editor-panel ${error ? 'has-error' : ''}`}>
      <div className="editor-header"><span>{title}</span><div>{onClear && value && <button onClick={onClear}><Trash2 size={14} /> 清空</button>}{onCopy && <button onClick={onCopy} disabled={!value}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '已复制' : '复制'}</button>}</div></div>
      <textarea value={value} readOnly={readOnly} placeholder={placeholder} onChange={(event) => onChange?.(event.target.value)} spellCheck={false} />
      <div className="editor-footer">{error ? <span className="error-text">{error}</span> : <span>{value.length.toLocaleString()} 字符</span>}</div>
    </div>
  )
}

function SiteWorkspace({ site, favorite, onFavorite }: { site: SiteDefinition; favorite: boolean; onFavorite: () => void }) {
  const [frameKey, setFrameKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const reload = () => { setLoading(true); setFrameKey((key) => key + 1) }
  const fullscreen = () => iframeRef.current?.requestFullscreen()
  return (
    <div className="site-page">
      <div className="site-toolbar">
        <div className="site-identity"><span className="site-logo" style={{ background: site.color }}>{site.initials}</span><div><strong>{site.name}</strong><span>{site.description}</span></div></div>
        <div className="address-bar"><ShieldCheck size={14} /><span>{site.url}</span></div>
        <div className="site-actions">
          <button className={`icon-button ${favorite ? 'active' : ''}`} onClick={onFavorite} title="收藏"><Star size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
          <button className="icon-button" onClick={reload} title="刷新"><RefreshCw size={17} /></button>
          <button className="icon-button" onClick={fullscreen} title="全屏"><Maximize2 size={17} /></button>
          <a className="open-external" href={site.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> 新标签页</a>
        </div>
      </div>
      <div className="frame-wrap">
        {loading && <div className="frame-loading"><span className="spinner" /><strong>正在连接 {site.name}</strong><small>如果目标网站限制内嵌，可使用右上角“新标签页”打开</small></div>}
        <iframe
          key={frameKey}
          ref={iframeRef}
          src={site.url}
          title={site.name}
          onLoad={() => setLoading(false)}
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  )
}

function CommandPalette({ query, searchRef, onQuery, onClose, onNavigate }: { query: string; searchRef: React.RefObject<HTMLInputElement | null>; onQuery: (value: string) => void; onClose: () => void; onNavigate: (view: ActiveView) => void }) {
  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const all = [
      { key: 'checkin', name: '每日签到', description: '记录并提醒每天需要签到的网站', label: '日常', icon: CalendarCheck2, view: { type: 'checkin' } as ActiveView, keywords: '每日签到 签到 提醒 网站' },
      ...tools.map((item) => ({ key: `tool:${item.id}`, name: item.name, description: item.description, label: '工具', icon: item.icon, view: { type: 'tool', id: item.id } as ActiveView, keywords: `${item.name} ${item.description}` })),
      ...sites.map((item) => ({ key: `site:${item.id}`, name: item.name, description: item.description, label: '网站', icon: ExternalLink, view: { type: 'site', id: item.id } as ActiveView, keywords: `${item.name} ${item.description} ${item.url}` })),
    ]
    return keyword ? all.filter(({ keywords }) => keywords.toLowerCase().includes(keyword)) : all
  }, [query])
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="palette-input"><Search size={20} /><input ref={searchRef} value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜索 Base64、JSON、IP、Codex…" /><button onClick={onClose}><X size={17} /></button></div>
        <div className="palette-results">
          <div className="palette-label">{query ? `搜索结果 · ${results.length}` : '全部内容'}</div>
          {results.map((item) => {
            const Icon = item.icon
            return <button key={item.key} onClick={() => onNavigate(item.view)}><span className="result-icon"><Icon size={18} /></span><span><strong>{item.name}</strong><small>{item.description}</small></span><em>{item.label}</em></button>
          })}
          {results.length === 0 && <div className="empty-state">没有找到匹配内容</div>}
        </div>
        <div className="palette-footer"><span><kbd>ESC</kbd> 关闭</span><span>所有工具均在本地运行</span></div>
      </div>
    </div>
  )
}

export default App
