import { useMemo, useState } from 'react'
import { Check, Copy, Dices, RefreshCw } from 'lucide-react'
import { Tabs, ToolPageShell, ToolToolbar } from '../components/common'
import { useClipboard } from '../hooks/useClipboard'
import { generateRandomData, type RandomDataCategory } from '../lib/random-data'
import type { ToolDefinition } from '../types'

interface RandomDataPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

const CATEGORIES: ReadonlyArray<{ id: RandomDataCategory; label: string; description: string }> = [
  { id: 'china-profile', label: '国内收货用户', description: '收货人、手机、邮箱和完整地址' },
  { id: 'us-profile', label: '美国账单用户', description: '用户信息、测试电话和账单地址' },
  { id: 'contacts', label: '联系信息', description: '常见手机号、固话与邮箱' },
  { id: 'passwords', label: '登录密码', description: '符合常见正则约束的密码' },
]

const CATEGORY_TABS = CATEGORIES.map((item) => ({ id: item.id, label: item.label }))

export default function RandomDataPage({ tool, favorite, onFavorite }: RandomDataPageProps) {
  const [category, setCategory] = useState<RandomDataCategory>('china-profile')
  const [revision, setRevision] = useState(0)
  const { copied, copy, reset } = useClipboard()
  const definition = CATEGORIES.find((item) => item.id === category)!
  const fields = useMemo(() => generateRandomData(category), [category, revision])

  function regenerate() {
    setRevision((value) => value + 1)
    reset()
  }

  return (
    <ToolPageShell
      tool={tool}
      favorite={favorite}
      onFavorite={onFavorite}
      className="random-data-page"
      description={`${definition.label} · ${definition.description}`}
    >
      <ToolToolbar
        tabs={<Tabs items={CATEGORY_TABS} value={category} onChange={setCategory} label="随机数据类型" className="random-data-tabs" />}
        controls={
          <button className="primary-button" onClick={regenerate}>
            <RefreshCw size={15} /> 重新生成
          </button>
        }
        className="random-data-toolbar"
        controlsClassName="random-data-actions"
      />
      <section className="random-data-results">
        {fields.map((field) => (
          <div className="random-data-row" key={field.id}>
            <span>{field.label}</span>
            <div>
              <code>{field.value}</code>
              {field.detail && <small>{field.detail}</small>}
            </div>
            <button className="icon-button subtle" onClick={() => void copy(field.value, field.id)} title={`复制${field.label}`}>
              {copied === field.id ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        ))}
      </section>
    </ToolPageShell>
  )
}
