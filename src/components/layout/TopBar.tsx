import { Moon, Sun } from 'lucide-react'
import { getViewTitle } from '../../config/catalog'
import type { ActiveView } from '../../types'

interface TopBarProps {
  active: ActiveView
  theme: 'dark' | 'light'
  onTheme: () => void
}

export default function TopBar({ active, theme, onTheme }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>ToolDock</span><span>/</span><strong>{getViewTitle(active)}</strong></div>
      <div className="top-actions">
        <span className="local-status"><span /> 本地运行</span>
        <button className="icon-button" onClick={onTheme} title="切换主题">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      </div>
    </header>
  )
}
