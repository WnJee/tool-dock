import { useEffect, useRef, useState } from 'react'
import CommandPalette from './components/CommandPalette'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import { SITES, TOOLS } from './config/catalog'
import CheckinPage from './pages/CheckinPage'
import DashboardPage from './pages/DashboardPage'
import EmbeddedSitePage from './pages/EmbeddedSitePage'
import MovieLibraryPage from './pages/MovieLibraryPage'
import ToolPage from './pages/ToolPage'
import { getStoredValue } from './storage'
import type { ActiveView } from './types'

function App() {
  const [active, setActive] = useState<ActiveView>(() => getStoredValue('tooldock.active', { type: 'home' }))
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => getStoredValue('tooldock.favorites', ['tool:base64', 'tool:json', 'site:codex-radar']))
  const [recent, setRecent] = useState<string[]>(() => getStoredValue('tooldock.recent', []))
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredValue('tooldock.theme', 'dark'))
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
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openSearch()
      }
      if (event.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function openSearch() {
    setSearchOpen(true)
    window.setTimeout(() => searchRef.current?.focus(), 20)
  }

  function navigate(next: ActiveView) {
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

  function toggleFavorite(key: string) {
    setFavorites((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  function renderActivePage() {
    if (active.type === 'home') return <DashboardPage favorites={favorites} recent={recent} onNavigate={navigate} onFavorite={toggleFavorite} />
    if (active.type === 'checkin') return <CheckinPage />
    if (active.type === 'movies') return <MovieLibraryPage />
    if (active.type === 'tool') {
      const tool = TOOLS.find((item) => item.id === active.id)
      return tool ? <ToolPage key={tool.id} tool={tool} favorite={favorites.includes(`tool:${tool.id}`)} onFavorite={() => toggleFavorite(`tool:${tool.id}`)} /> : null
    }
    const site = SITES.find((item) => item.id === active.id)
    return site ? <EmbeddedSitePage key={site.id} site={site} favorite={favorites.includes(`site:${site.id}`)} onFavorite={() => toggleFavorite(`site:${site.id}`)} /> : null
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar active={active} collapsed={sidebarCollapsed} favorites={favorites} onCollapse={() => setSidebarCollapsed((value) => !value)} onNavigate={navigate} onSearch={openSearch} />
      <main className="main-panel">
        <TopBar active={active} theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        <div className="workspace">{renderActivePage()}</div>
      </main>
      {searchOpen && <CommandPalette query={query} searchRef={searchRef} onQuery={setQuery} onClose={() => setSearchOpen(false)} onNavigate={navigate} />}
    </div>
  )
}

export default App
