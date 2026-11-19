import { useMemo, useState } from 'react'
import { Check, Clock3, Copy, CornerDownLeft, RefreshCw } from 'lucide-react'
import { SegmentedControl, ToolPageShell } from '../components/common'
import { useClipboard } from '../hooks/useClipboard'
import { adjustTimestamp, formatTimestampInput, getTimestampValues, parseTimestampInput, type TimestampUnit } from '../lib/timestamp'
import type { ToolDefinition } from '../types'

interface TimestampPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

const OPERATIONS: ReadonlyArray<readonly ['add' | 'subtract', string]> = [
  ['add', '+'],
  ['subtract', '−'],
]
const UNITS: ReadonlyArray<readonly [TimestampUnit, string]> = [
  ['days', '天'],
  ['hours', '小时'],
  ['minutes', '分'],
  ['seconds', '秒'],
]

export default function TimestampPage({ tool, favorite, onFavorite }: TimestampPageProps) {
  const [input, setInput] = useState(() => formatTimestampInput(new Date()))
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('0')
  const [unit, setUnit] = useState<TimestampUnit>('days')
  const { copied, copy, reset } = useClipboard()
  const result = useMemo(() => {
    let baseDate: Date
    try {
      baseDate = parseTimestampInput(input)
    } catch (caught) {
      return { date: undefined, values: [], error: caught instanceof Error ? caught.message : '时间转换失败', errorSource: 'input' as const }
    }
    try {
      const numericAmount = amount.trim() ? Number(amount) : 0
      if (numericAmount < 0) throw new Error('时间加减数值不能小于 0，请使用加/减按钮切换方向')
      const date = adjustTimestamp(baseDate, operation === 'subtract' ? -numericAmount : numericAmount, unit)
      return { date, values: getTimestampValues(date), error: '', errorSource: '' as const }
    } catch (caught) {
      return { date: undefined, values: [], error: caught instanceof Error ? caught.message : '时间运算失败', errorSource: 'operation' as const }
    }
  }, [amount, input, operation, unit])

  function resetToNow() {
    setInput(formatTimestampInput(new Date()))
    setAmount('0')
    reset()
  }

  function applyResult() {
    if (!result.date) return
    setInput(formatTimestampInput(result.date))
    setAmount('0')
  }

  return (
    <ToolPageShell tool={tool} favorite={favorite} onFavorite={onFavorite} className="timestamp-page" description="Unix 时间戳、本地时间与 ISO 8601 互转">
      <section className="timestamp-input-panel">
        <label htmlFor="timestamp-input">时间或时间戳</label>
        <div className={`timestamp-input ${result.errorSource === 'input' ? 'has-error' : ''}`}>
          <Clock3 size={17} />
          <input
            id="timestamp-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="1721203200 / 1721203200000 / 2026-07-31 16:00:00 / ISO 8601"
          />
        </div>
        <button className="secondary-button timestamp-reset" onClick={resetToNow}>
          <RefreshCw size={15} /> 重置为当前时间
        </button>
        <div className="timestamp-input-status">{result.errorSource === 'input' && <span className="error-text">{result.error}</span>}</div>
      </section>
      <section className={`timestamp-calculator ${result.errorSource === 'operation' ? 'has-error' : ''}`}>
        <span className="timestamp-calculator-label">时间加减</span>
        <SegmentedControl value={operation} options={OPERATIONS} onChange={setOperation} label="加减方向" className="timestamp-operation" />
        <input
          className="timestamp-amount"
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="时间加减数值"
        />
        <SegmentedControl value={unit} options={UNITS} onChange={setUnit} label="时间单位" className="timestamp-units" />
        <button className="secondary-button timestamp-apply" disabled={!result.date || !Number(amount)} onClick={applyResult}>
          <CornerDownLeft size={15} /> 应用结果
        </button>
        {result.errorSource === 'operation' && <span className="timestamp-calculator-error">{result.error}</span>}
      </section>
      <section className="timestamp-results-panel">
        <div className="timestamp-value-list">
          {result.values.map((item) => (
            <div className="timestamp-value-row" key={item.id}>
              <span>{item.label}</span>
              <code>{item.value}</code>
              <button className="icon-button subtle" onClick={() => void copy(item.value, item.id)} title={`复制${item.label}`}>
                {copied === item.id ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          ))}
          {!result.values.length && (
            <div className="timestamp-empty">
              <Clock3 size={25} />
              <span>输入有效时间后显示全部格式</span>
            </div>
          )}
        </div>
      </section>
    </ToolPageShell>
  )
}
