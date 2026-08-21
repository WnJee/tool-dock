import { useMemo, useState } from 'react'
import { Check, Clipboard, Copy, Link2, Pencil, Plus, Radio, Trash2, Wifi, X } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { createNodeId, encodeSubscription, normalizeNodeUrl, resolveNodeInput, type ProxyNode } from '../node-utils'
import { getStoredValue } from '../storage'

const STORAGE_KEY = 'tooldock.nodes'
const WORKER_API = 'https://cf-workers-sub.wnjienn.workers.dev'

export default function NodesPage() {
  const [nodes, setNodes] = useState<ProxyNode[]>(() => getStoredValue<ProxyNode[]>(STORAGE_KEY, []).filter((node) => !/^https?:\/\//i.test(node.url)))
  const [editing, setEditing] = useState<ProxyNode | 'new' | null>(null)
  const [copied, setCopied] = useState<'content' | 'url' | null>(null)
  const [adminToken, setAdminToken] = useState(() => getStoredValue('tooldock.nodes-token', ''))
  const [syncState, setSyncState] = useState('')
  const activeNodes = useMemo(() => nodes.filter((node) => node.enabled), [nodes])
  const subscription = useMemo(() => encodeSubscription(nodes), [nodes])
  const subscriptionUrl = `${WORKER_API}/subscription`

  const update = (next: ProxyNode[]) => {
    setNodes(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    if (adminToken) {
      void fetch(`${WORKER_API}/nodes`, { method: 'PUT', headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' }, body: JSON.stringify({ nodes: next }) })
        .then((response) => setSyncState(response.ok ? '已同步' : '同步失败'))
        .catch(() => setSyncState('同步失败'))
    }
  }
  const save = (drafts: Array<Omit<ProxyNode, 'id' | 'enabled'>>) => {
    if (editing === 'new') update([...nodes, ...drafts.map((draft) => ({ ...draft, id: createNodeId(), enabled: true }))])
    else if (editing) update(nodes.map((node) => node.id === editing.id ? { ...node, ...drafts[0] } : node))
    setEditing(null)
  }
  const copy = async (value: string, kind: 'content' | 'url') => { await navigator.clipboard?.writeText(value); setCopied(kind); window.setTimeout(() => setCopied(null), 1500) }
  const remove = (node: ProxyNode) => { if (window.confirm(`确定删除“${node.name}”吗？`)) update(nodes.filter((item) => item.id !== node.id)) }

  return <div className="content-page nodes-page page-container">
    <PageHeader icon={Radio} title="节点订阅" description="维护节点列表，并生成可供 Clash 系列客户端导入的订阅地址" color="#eea853" action={<button className="primary-button" onClick={() => setEditing('new')}><Plus size={17} /> 添加节点</button>} />
    <section className="nodes-summary"><div><span>已启用节点</span><strong>{activeNodes.length}</strong><small>共 {nodes.length} 个节点</small></div><div className="nodes-subscription"><span>Clash 订阅地址</span><code>{subscriptionUrl}</code><button className="secondary-button" onClick={() => copy(subscriptionUrl, 'url')}><Link2 size={15} /> {copied === 'url' ? '已复制' : '复制地址'}</button></div></section>
    <section className="nodes-list-panel"><div className="nodes-list-header"><span>节点</span><span>地址</span><span>状态</span><span>操作</span></div>
      {nodes.map((node) => <div className={`node-row ${node.enabled ? '' : 'disabled'}`} key={node.id}><div className="node-name"><span className="node-avatar"><Wifi size={15} /></span><div><strong>{node.name}</strong><small>{node.note || '未填写备注'}</small></div></div><code>{node.url}</code><button className={`node-status ${node.enabled ? 'enabled' : ''}`} onClick={() => update(nodes.map((item) => item.id === node.id ? { ...item, enabled: !item.enabled } : item))}><span />{node.enabled ? '已启用' : '已停用'}</button><div className="node-actions"><button className="icon-button subtle" title="编辑" onClick={() => setEditing(node)}><Pencil size={15} /></button><button className="icon-button subtle danger" title="删除" onClick={() => remove(node)}><Trash2 size={15} /></button></div></div>)}
      {nodes.length === 0 && <div className="nodes-empty"><Radio size={34} /><strong>还没有节点</strong><span>添加节点后即可生成统一订阅内容</span><button className="primary-button" onClick={() => setEditing('new')}><Plus size={15} /> 添加第一个节点</button></div>}
    </section>
    <section className="subscription-panel"><div><strong>Clash 订阅格式</strong><span>接口返回纯文本 Base64 节点列表，仅包含已启用节点，可直接添加到 Clash、Mihomo 等客户端</span></div><button className="secondary-button" disabled={!activeNodes.length} onClick={() => copy(subscription, 'content')}><Clipboard size={15} /> {copied === 'content' ? '已复制' : '复制 Base64 内容'}</button></section>
    <section className="nodes-config"><label><span>管理令牌 <em>选填</em></span><input type="password" value={adminToken} onChange={(event) => { setAdminToken(event.target.value); localStorage.setItem('tooldock.nodes-token', event.target.value) }} placeholder="配置 NODE_ADMIN_TOKEN 后填写" /></label><small>{syncState || '填写后，保存节点会同步到 Cloudflare KV；留空则仅保存在当前浏览器'}</small></section>
    {editing && <NodeEditor node={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} />}
  </div>
}

function NodeEditor({ node, onClose, onSave }: { node: ProxyNode | null; onClose: () => void; onSave: (drafts: Array<Omit<ProxyNode, 'id' | 'enabled'>>) => void }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [name, setName] = useState(node?.name ?? '')
  const [url, setUrl] = useState(node?.url ?? '')
  const [note, setNote] = useState(node?.note ?? '')
  const [bulkInput, setBulkInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); try {
    if (mode === 'bulk' && !node) { setLoading(true); onSave((await resolveNodeInput(bulkInput)).map((item, index) => ({ name: getNodeName(item, index), url: item, note: '' }))) }
    else { if (!name.trim()) throw new Error('请输入节点名称'); onSave([{ name: name.trim(), url: normalizeNodeUrl(url), note: note.trim() }]) }
  } catch (caught) { setError(caught instanceof Error ? caught.message : '节点信息无效') } finally { setLoading(false) } }
  return <div className="dialog-backdrop" onMouseDown={onClose}><form className="site-editor node-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><div className="dialog-heading"><div><strong>{node ? '编辑节点' : '添加节点'}</strong><span>支持订阅地址、协议节点和 Base64 内容</span></div><button type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>{!node && <div className="segmented node-editor-modes"><button type="button" className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>单个节点</button><button type="button" className={mode === 'bulk' ? 'active' : ''} onClick={() => setMode('bulk')}>粘贴批量</button></div>}{mode === 'bulk' && !node ? <label><span>节点内容</span><textarea autoFocus value={bulkInput} onChange={(event) => setBulkInput(event.target.value)} placeholder={'可粘贴订阅地址，系统会自动拉取并解析其中的节点\n也可直接粘贴订阅响应里的 Base64 内容或逐行节点'} rows={8} /></label> : <><label><span>节点名称</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：香港 01" /></label><label><span>节点地址</span><div className="url-input"><Link2 size={15} /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="ss://、vmess:// 或 trojan://…" /></div></label><label><span>备注 <em>选填</em></span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：低延迟" /></label></>}{error && <div className="form-error">{error}</div>}<div className="dialog-actions"><button type="button" onClick={onClose}>取消</button><button type="submit" className="primary-button" disabled={loading}><Check size={15} /> {loading ? '正在解析…' : mode === 'bulk' && !node ? '导入节点' : node ? '保存修改' : '添加节点'}</button></div></form></div>
}

function getNodeName(url: string, index: number) {
  try { return new URL(url).hostname || `节点 ${index + 1}` } catch { return `节点 ${index + 1}` }
}
