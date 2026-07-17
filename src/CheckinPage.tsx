import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, Check, CircleCheckBig, ExternalLink, Link2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { getLocalDateKey, normalizeWebsiteUrl } from './checkin-utils'

interface CheckinSite {
  id: string
  name: string
  url: string
  note: string
}

interface DailyCompletion {
  date: string
  ids: string[]
}

type Filter = 'pending' | 'all' | 'completed'

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function CheckinPage() {
  const [today, setToday] = useState(getLocalDateKey)
  const [sites, setSites] = useState<CheckinSite[]>(() => readStored('tooldock.checkins.sites', []))
  const [completion, setCompletion] = useState<DailyCompletion>(() => {
    const stored = readStored<DailyCompletion>('tooldock.checkins.completion', { date: today, ids: [] })
    return stored.date === today ? stored : { date: today, ids: [] }
  })
  const [filter, setFilter] = useState<Filter>('pending')
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<CheckinSite | null>(null)

  useEffect(() => localStorage.setItem('tooldock.checkins.sites', JSON.stringify(sites)), [sites])
  useEffect(() => localStorage.setItem('tooldock.checkins.completion', JSON.stringify(completion)), [completion])
  useEffect(() => {
    const timer = window.setInterval(() => setToday(getLocalDateKey()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (completion.date !== today) setCompletion({ date: today, ids: [] })
  }, [completion.date, today])

  const completed = new Set(completion.ids)
  const completedCount = sites.filter((site) => completed.has(site.id)).length
  const visibleSites = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return sites
      .filter((site) => !keyword || `${site.name} ${site.url} ${site.note}`.toLowerCase().includes(keyword))
      .filter((site) => filter === 'all' || (filter === 'completed' ? completed.has(site.id) : !completed.has(site.id)))
      .sort((left, right) => Number(completed.has(left.id)) - Number(completed.has(right.id)))
  }, [completion.ids, filter, query, sites])

  const toggleCompleted = (id: string) => {
    setCompletion((current) => ({
      date: today,
      ids: current.ids.includes(id) ? current.ids.filter((item) => item !== id) : [...current.ids, id],
    }))
  }

  const openEditor = (site?: CheckinSite) => {
    setEditingSite(site ?? null)
    setEditorOpen(true)
  }

  const saveSite = (draft: Omit<CheckinSite, 'id'>) => {
    if (editingSite) {
      setSites((current) => current.map((site) => site.id === editingSite.id ? { ...site, ...draft } : site))
    } else {
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setSites((current) => [...current, { id, ...draft }])
    }
    setEditorOpen(false)
    setEditingSite(null)
  }

  const deleteSite = (site: CheckinSite) => {
    if (!window.confirm(`确定删除“${site.name}”吗？`)) return
    setSites((current) => current.filter((item) => item.id !== site.id))
    setCompletion((current) => ({ ...current, ids: current.ids.filter((id) => id !== site.id) }))
  }

  const progress = sites.length === 0 ? 0 : Math.round(completedCount / sites.length * 100)
  return (
    <div className="content-page checkin-page">
      <div className="page-heading checkin-heading">
        <div className="heading-main"><span className="tool-icon large checkin-icon"><CalendarCheck2 size={25} /></span><div><h1>每日签到</h1><p>{formatToday()} · 签到状态将在第二天自动重置</p></div></div>
        <button className="primary-button" onClick={() => openEditor()}><Plus size={17} /> 添加网站</button>
      </div>

      <section className="checkin-summary">
        <div className="summary-count"><span>今日进度</span><strong>{completedCount}<em>/ {sites.length}</em></strong><small>{sites.length === 0 ? '先添加需要每天签到的网站' : completedCount === sites.length ? '今天的签到已经全部完成' : `还有 ${sites.length - completedCount} 个网站待签到`}</small></div>
        <div className="progress-area"><div className="progress-meta"><span>完成率</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
        <CircleCheckBig className={completedCount > 0 && completedCount === sites.length ? 'complete' : ''} size={48} />
      </section>

      <section className="checkin-list-panel">
        <div className="checkin-toolbar">
          <div className="segmented checkin-filters">
            <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>待签到 {sites.length - completedCount}</button>
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 {sites.length}</button>
            <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>已完成 {completedCount}</button>
          </div>
          <label className="checkin-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网站或备注" /></label>
        </div>
        <div className="checkin-list-header"><span>状态</span><span>网站</span><span>备注</span><span>操作</span></div>
        <div className="checkin-list">
          {visibleSites.map((site) => {
            const isCompleted = completed.has(site.id)
            return (
              <div className={`checkin-row ${isCompleted ? 'completed' : ''}`} key={site.id}>
                <label className="check-control"><input type="checkbox" checked={isCompleted} onChange={() => toggleCompleted(site.id)} aria-label={`标记 ${site.name} 今日已签到`} /><span><Check size={14} /></span></label>
                <div className="checkin-site"><span className="checkin-avatar">{getInitials(site.name)}</span><div><strong>{site.name}</strong><a href={site.url} target="_blank" rel="noreferrer">{site.url}</a></div></div>
                <span className="checkin-note">{site.note || '—'}</span>
                <div className="checkin-actions"><button className="icon-button subtle" onClick={() => openEditor(site)} title="编辑"><Pencil size={15} /></button><button className="icon-button subtle danger" onClick={() => deleteSite(site)} title="删除"><Trash2 size={15} /></button><a className="checkin-open" href={site.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> 去签到</a></div>
              </div>
            )
          })}
          {visibleSites.length === 0 && <div className="checkin-empty"><CalendarCheck2 size={32} /><strong>{sites.length === 0 ? '还没有签到网站' : filter === 'pending' && completedCount === sites.length ? '今天已全部签到' : '没有匹配的网站'}</strong><span>{sites.length === 0 ? '添加后会一直保存在当前浏览器中' : '可以切换筛选条件查看其他网站'}</span>{sites.length === 0 && <button onClick={() => openEditor()}><Plus size={15} /> 添加第一个网站</button>}</div>}
        </div>
      </section>
      {editorOpen && <SiteEditor site={editingSite} onClose={() => { setEditorOpen(false); setEditingSite(null) }} onSave={saveSite} />}
    </div>
  )
}

function SiteEditor({ site, onClose, onSave }: { site: CheckinSite | null; onClose: () => void; onSave: (site: Omit<CheckinSite, 'id'>) => void }) {
  const [name, setName] = useState(site?.name ?? '')
  const [url, setUrl] = useState(site?.url ?? '')
  const [note, setNote] = useState(site?.note ?? '')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) { setError('请输入网站名称'); return }
    try {
      onSave({ name: name.trim(), url: normalizeWebsiteUrl(url), note: note.trim() })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '网站地址无效')
    }
  }
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <form className="site-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading"><div><strong>{site ? '编辑签到网站' : '添加签到网站'}</strong><span>信息只保存在当前浏览器</span></div><button type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
        <label><span>网站名称</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：阿里云社区" /></label>
        <label><span>网站地址</span><div className="url-input"><Link2 size={15} /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/checkin" /></div></label>
        <label><span>备注 <em>选填</em></span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：领取每日积分" /></label>
        {error && <div className="form-error">{error}</div>}
        <div className="dialog-actions"><button type="button" onClick={onClose}>取消</button><button type="submit" className="primary-button">{site ? '保存修改' : '添加网站'}</button></div>
      </form>
    </div>
  )
}

function getInitials(name: string) {
  return [...name.trim()].slice(0, 2).join('').toUpperCase()
}

function formatToday() {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
}

export default CheckinPage
