import { useMemo, useState } from 'react'
import { Check, Copy, Dices, RefreshCw, ShieldCheck, Star } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { generateRandomData, type RandomDataCategory } from '../random-data'
import type { ToolDefinition } from '../types'

interface RandomDataPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

const CATEGORIES: Array<{ id: RandomDataCategory; label: string; description: string }> = [
  { id: 'china-profile', label: '国内收货用户', description: '收货人、手机、邮箱和完整地址' },
  { id: 'us-profile', label: '美国账单用户', description: '用户信息、测试电话和账单地址' },
  { id: 'contacts', label: '联系信息', description: '常见手机号、固话与邮箱' },
  { id: 'passwords', label: '登录密码', description: '符合常见正则约束的密码' },
]

export default function RandomDataPage({ tool, favorite, onFavorite }: RandomDataPageProps) {
  const [category, setCategory] = useState<RandomDataCategory>('china-profile')
  const [revision, setRevision] = useState(0)
  const [copied, setCopied] = useState('')
  const definition = CATEGORIES.find((item) => item.id === category)!
  const fields = useMemo(() => generateRandomData(category), [category, revision])

  function regenerate() {
    setRevision((value) => value + 1)
    setCopied('')
  }

  async function copyValue(id: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(id)
    window.setTimeout(() => setCopied((current) => current === id ? '' : current), 1200)
  }

  const favoriteAction = <button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={onFavorite}><Star size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? '已收藏' : '收藏'}</button>
  return (
    <div className="content-page page-container random-data-page">
      <PageHeader icon={tool.icon} title={tool.name} description={`${definition.label} · ${definition.description} · 仅在当前浏览器生成`} color={tool.color} action={favoriteAction} />
      <div className="crypto-toolbar random-data-toolbar">
        <div className="crypto-algorithm-tabs random-data-tabs" role="tablist" aria-label="随机数据类型">
          {CATEGORIES.map((item) => <button key={item.id} type="button" role="tab" aria-selected={category === item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>)}
        </div>
        <div className="random-data-actions"><span><ShieldCheck size={14} /> 使用加密安全随机源</span><button className="primary-button" onClick={regenerate}><RefreshCw size={15} /> 重新生成</button></div>
      </div>
      <section className="random-data-results">
        {fields.map((field) => <div className="random-data-row" key={field.id}>
          <span>{field.label}</span>
          <div><code>{field.value}</code>{field.detail && <small>{field.detail}</small>}</div>
          <button className="icon-button subtle" onClick={() => copyValue(field.id, field.value)} title={`复制${field.label}`}>{copied === field.id ? <Check size={15} /> : <Copy size={15} />}</button>
        </div>)}
      </section>
      <div className="shortcut-strip"><span><Dices size={13} /> 所有内容为合成测试数据，不代表真实个人或地址</span><span>·</span><span className="privacy-inline"><ShieldCheck size={13} /> 本地生成</span></div>
    </div>
  )
}
