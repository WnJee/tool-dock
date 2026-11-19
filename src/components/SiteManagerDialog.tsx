import { ExternalLink, Link2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { createCustomSite, CUSTOM_SITE_COLORS } from '../lib/site'
import type { CustomSiteDraft } from '../lib/site'
import type { SiteDefinition } from '../types'

interface SiteManagerDialogProps {
  builtInSites: SiteDefinition[]
  customSites: SiteDefinition[]
  onChange: (sites: SiteDefinition[]) => void
  onClose: () => void
}

export default function SiteManagerDialog({ builtInSites, customSites, onChange, onClose }: SiteManagerDialogProps) {
  const [editingSite, setEditingSite] = useState<SiteDefinition | 'new' | null>(null)

  const deleteSite = (site: SiteDefinition) => {
    if (!window.confirm(`确定删除“${site.name}”吗？`)) return
    onChange(customSites.filter((item) => item.id !== site.id))
  }

  const saveSite = (draft: CustomSiteDraft) => {
    const current = editingSite === 'new' ? null : editingSite
    const next = createCustomSite(current?.id ?? createSiteId(), draft)
    const duplicate = [...builtInSites, ...customSites].find((site) => site.id !== current?.id && site.url === next.url)
    if (duplicate) throw new Error(`“${duplicate.name}”已使用这个网站地址`)
    onChange(current ? customSites.map((site) => (site.id === current.id ? next : site)) : [...customSites, next])
    setEditingSite(null)
  }

  if (editingSite) {
    return <CustomSiteEditor site={editingSite === 'new' ? null : editingSite} onBack={() => setEditingSite(null)} onSave={saveSite} />
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="site-manager-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <div>
            <strong>管理常用网站</strong>
            <span>自定义网站保存在当前浏览器，并包含在全站备份中</span>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="site-manager-toolbar">
          <button className="primary-button" onClick={() => setEditingSite('new')}>
            <Plus size={16} /> 添加网站
          </button>
        </div>
        <div className="site-manager-list">
          {customSites.map((site) => (
            <div className="site-manager-row" key={site.id}>
              <span className="site-mini" style={{ background: site.color }}>
                {site.initials}
              </span>
              <div>
                <strong>{site.name}</strong>
                <small>{site.description}</small>
                <a href={site.url} target="_blank" rel="noreferrer">
                  {site.url}
                </a>
              </div>
              <div className="site-manager-actions">
                <a href={site.url} target="_blank" rel="noreferrer" title="新标签页打开">
                  <ExternalLink size={15} />
                </a>
                <button onClick={() => setEditingSite(site)} title="编辑">
                  <Pencil size={15} />
                </button>
                <button className="danger" onClick={() => deleteSite(site)} title="删除">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {customSites.length === 0 && (
            <div className="site-manager-empty">
              <Link2 size={30} />
              <strong>还没有自定义网站</strong>
              <span>添加后会出现在侧栏、搜索和收藏中</span>
              <button className="primary-button" onClick={() => setEditingSite('new')}>
                <Plus size={15} /> 添加第一个网站
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function CustomSiteEditor({ site, onBack, onSave }: { site: SiteDefinition | null; onBack: () => void; onSave: (draft: CustomSiteDraft) => void }) {
  const [name, setName] = useState(site?.name ?? '')
  const [description, setDescription] = useState(site?.description ?? '')
  const [url, setUrl] = useState(site?.url ?? '')
  const [color, setColor] = useState(site?.color ?? CUSTOM_SITE_COLORS[0])
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    try {
      onSave({ name, description, url, color })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '网站信息无效')
    }
  }
  return (
    <div className="dialog-backdrop" onMouseDown={onBack}>
      <form className="site-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <div>
            <strong>{site ? '编辑常用网站' : '添加常用网站'}</strong>
            <span>支持 HTTP 和 HTTPS 网站</span>
          </div>
          <button type="button" onClick={onBack} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <label>
          <span>网站名称</span>
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：GitHub" />
        </label>
        <label>
          <span>网站地址</span>
          <div className="url-input">
            <Link2 size={15} />
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/" />
          </div>
        </label>
        <label>
          <span>
            网站描述 <em>选填</em>
          </span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="例如：代码托管与协作平台" />
        </label>
        <label>
          <span>标识颜色</span>
          <div className="site-color-options">
            {CUSTOM_SITE_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                className={color === option ? 'active' : ''}
                style={{ background: option }}
                onClick={() => setColor(option)}
                aria-label={`选择颜色 ${option}`}
              />
            ))}
          </div>
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="dialog-actions">
          <button type="button" onClick={onBack}>
            返回
          </button>
          <button type="submit" className="primary-button">
            {site ? '保存修改' : '添加网站'}
          </button>
        </div>
      </form>
    </div>
  )
}

function createSiteId() {
  return `custom-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
}
