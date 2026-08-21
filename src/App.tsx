import { useEffect, useMemo, useRef, useState } from 'react'
import CommandPalette from './components/CommandPalette'
import SettingsDrawer from './components/SettingsDrawer'
import SiteManagerDialog from './components/SiteManagerDialog'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import { SITES, TOOLS } from './config/catalog'
import type { WorkspaceData } from './backup-utils'
import type { CheckinSite, DailyCompletion } from './checkin-utils'
import CheckinPage from './pages/CheckinPage'
import CryptoPage from './pages/CryptoPage'
import DashboardPage from './pages/DashboardPage'
import EmbeddedSitePage from './pages/EmbeddedSitePage'
import FormatterPage from './pages/FormatterPage'
import MovieLibraryPage from './pages/MovieLibraryPage'
import RandomDataPage from './pages/RandomDataPage'
import TimestampPage from './pages/TimestampPage'
import { getStoredValue } from './storage'
import type { ActiveView, SiteDefinition } from './types'

function App() {
  const [active, setActive] = useState<ActiveView>(() => getStoredValue('tooldock.active', { type: 'home' }))
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => getStoredValue('tooldock.favorites', ['tool:crypto', 'tool:json', 'site:codex-radar']))
  const [recent, setRecent] = useState<string[]>(() => getStoredValue('tooldock.recent', []))
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredValue('tooldock.theme', 'dark'))
  const [customSites, setCustomSites] = useState<SiteDefinition[]>(() => getStoredValue('tooldock.custom-sites', []))
  const [siteManagerOpen, setSiteManagerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const sites = useMemo(() => [...SITES, ...customSites], [customSites])

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
    localStorage.setItem('tooldock.custom-sites', JSON.stringify(customSites))
  }, [customSites])

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

  function updateCustomSites(nextSites: SiteDefinition[]) {
    const availableSiteKeys = new Set([...SITES, ...nextSites].map((site) => `site:${site.id}`))
    setCustomSites(nextSites)
    setFavorites((current) => current.filter((key) => !key.startsWith('site:') || availableSiteKeys.has(key)))
    setRecent((current) => {
      const updated = current.filter((key) => !key.startsWith('site:') || availableSiteKeys.has(key))
      localStorage.setItem('tooldock.recent', JSON.stringify(updated))
      return updated
    })
    setActive((current) => current.type === 'site' && !availableSiteKeys.has(`site:${current.id}`) ? { type: 'home' } : current)
  }

  function getWorkspaceData(): WorkspaceData {
    return {
      theme,
      active,
      favorites,
      recent,
      customSites,
      checkins: {
        sites: getStoredValue<CheckinSite[]>('tooldock.checkins.sites', []),
        completion: getStoredValue<DailyCompletion>('tooldock.checkins.completion', { date: '', ids: [] }),
      },
    }
  }

  function renderActivePage() {
    if (active.type === 'home') return <DashboardPage favorites={favorites} recent={recent} sites={sites} onNavigate={navigate} onFavorite={toggleFavorite} />
    if (active.type === 'checkin') return <CheckinPage />
    if (active.type === 'movies') return <MovieLibraryPage key="movie" />
    if (active.type === 'tv') return <MovieLibraryPage key="tv" mediaType="tv" />
    if (active.type === 'tool') {
      const tool = TOOLS.find((item) => item.id === active.id)
      if (!tool) return null
      const props = { tool, favorite: favorites.includes(`tool:${tool.id}`), onFavorite: () => toggleFavorite(`tool:${tool.id}`) }
      if (tool.id === 'crypto') return <CryptoPage key={tool.id} {...props} />
      if (tool.id === 'json') return <FormatterPage key={tool.id} {...props} />
      return tool.id === 'random' ? <RandomDataPage key={tool.id} {...props} /> : <TimestampPage key={tool.id} {...props} />
    }
    const site = sites.find((item) => item.id === active.id)
    return site ? <EmbeddedSitePage key={site.id} site={site} favorite={favorites.includes(`site:${site.id}`)} onFavorite={() => toggleFavorite(`site:${site.id}`)} /> : null
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar active={active} collapsed={sidebarCollapsed} favorites={favorites} sites={sites} onCollapse={() => setSidebarCollapsed((value) => !value)} onNavigate={navigate} onSearch={openSearch} onManageSites={() => setSiteManagerOpen(true)} />
      <main className="main-panel">
        <TopBar active={active} sites={sites} onSettings={() => setSettingsOpen(true)} />
        <div className="workspace">{renderActivePage()}</div>
      </main>
      {searchOpen && <CommandPalette query={query} searchRef={searchRef} sites={sites} onQuery={setQuery} onClose={() => setSearchOpen(false)} onNavigate={navigate} />}
      {siteManagerOpen && <SiteManagerDialog builtInSites={SITES} customSites={customSites} onChange={updateCustomSites} onClose={() => setSiteManagerOpen(false)} />}
      {settingsOpen && <SettingsDrawer data={getWorkspaceData()} theme={theme} onTheme={setTheme} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

export default App
