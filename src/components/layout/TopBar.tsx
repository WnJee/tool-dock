import { Settings } from 'lucide-react'
import { getViewTitle } from '../../config/catalog'
import type { ActiveView, SiteDefinition } from '../../types'

interface TopBarProps {
  active: ActiveView
  sites: SiteDefinition[]
  onSettings: () => void
}

export default function TopBar({ active, sites, onSettings }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>ToolDock</span>
        <span>/</span>
        <strong>{getViewTitle(active, sites)}</strong>
      </div>
      <div className="top-actions">
        <button className="icon-button" onClick={onSettings} title="设置">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
