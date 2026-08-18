import { DatabaseBackup, Download, HardDrive, Moon, Palette, Settings, ShieldCheck, Sun, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { createWorkspaceBackup, parseWorkspaceBackup, restoreWorkspaceBackup } from '../backup-utils'
import type { WorkspaceData } from '../backup-utils'

interface SettingsDrawerProps {
  data: WorkspaceData
  theme: 'dark' | 'light'
  onTheme: (theme: 'dark' | 'light') => void
  onClose: () => void
}

export default function SettingsDrawer({ data, theme, onTheme, onClose }: SettingsDrawerProps) {
  const importInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const exportBackup = () => {
    const backup = createWorkspaceBackup(data)
    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `tooldock-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000)
  }

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const backup = parseWorkspaceBackup(await file.text())
      if (!window.confirm('恢复备份将覆盖当前浏览器中的全部 ToolDock 数据，并重新加载页面。确定继续吗？')) return
      restoreWorkspaceBackup(backup, localStorage)
      window.location.reload()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '备份文件无法识别')
    }
  }

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="settings-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <header className="settings-drawer-header"><div><span><Settings size={18} /></span><div><strong>设置</strong><small>个性化与数据管理</small></div></div><button onClick={onClose} aria-label="关闭设置"><X size={19} /></button></header>

        <div className="settings-drawer-content">
          <section className="settings-section">
            <div className="settings-section-title"><Palette size={15} /><span>外观</span></div>
            <div className="settings-row"><div><strong>主题模式</strong><small>选择适合当前环境的界面主题</small></div><div className="theme-options"><button className={theme === 'light' ? 'active' : ''} onClick={() => onTheme('light')}><Sun size={15} /> 浅色</button><button className={theme === 'dark' ? 'active' : ''} onClick={() => onTheme('dark')}><Moon size={15} /> 深色</button></div></div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title"><DatabaseBackup size={15} /><span>备份与恢复</span></div>
            <p className="settings-section-description">统一迁移主题、页面状态、收藏、最近使用、自定义常用网站和签到数据。</p>
            <div className="settings-backup-actions">
              <button onClick={exportBackup}><span><Download size={18} /></span><div><strong>导出全站备份</strong><small>下载 JSON 备份文件</small></div></button>
              <button onClick={() => importInputRef.current?.click()}><span><Upload size={18} /></span><div><strong>从备份恢复</strong><small>覆盖当前浏览器数据</small></div></button>
              <input ref={importInputRef} type="file" accept="application/json,.json" onChange={importBackup} hidden />
            </div>
            {error && <div className="form-error">恢复失败：{error}</div>}
            <div className="settings-privacy"><ShieldCheck size={14} /><span>备份只在本地生成和读取，不会上传到服务器。</span></div>
          </section>

          <section className="settings-section about-section">
            <div className="settings-section-title"><HardDrive size={15} /><span>关于</span></div>
            <div className="about-row"><div><strong>ToolDock</strong><small>个人工具工作台</small></div><code>v0.1.0</code></div>
            <div className="about-row"><div><strong>数据存储</strong><small>当前浏览器本地存储</small></div><span>Local</span></div>
          </section>
        </div>
      </aside>
    </div>
  )
}
