import { useDeferredValue, useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import EditorPanel from '../components/tools/EditorPanel'
import SegmentedControl from '../components/common/SegmentedControl'
import Tabs, { type TabItem } from '../components/common/Tabs'
import ToolPageShell from '../components/common/ToolPageShell'
import ToolToolbar from '../components/common/ToolToolbar'
import { useClipboard } from '../hooks/useClipboard'
import { downloadText } from '../lib/download'
import { formatBytes } from '../lib/format'
import {
  DEFAULT_TEXT_OPTIONS,
  TEXT_CASES,
  applyTextPipeline,
  getTextStats,
  type TextCase,
  type TextFilterKind,
  type TextFilterMode,
  type TextOptions,
  type TextSortOrder,
} from '../lib/text'
import type { ToolDefinition } from '../types'

type OptionTab = 'clean' | 'order' | 'case' | 'output'

const OPTION_TABS: ReadonlyArray<TabItem<OptionTab>> = [
  { id: 'clean', label: '清洗' },
  { id: 'order', label: '排序与编号' },
  { id: 'case', label: '大小写' },
  { id: 'output', label: '输出' },
]

const SORT_OPTIONS: ReadonlyArray<readonly [TextSortOrder, string]> = [
  ['none', '不排序'],
  ['asc', '升序'],
  ['desc', '降序'],
  ['length-asc', '短到长'],
  ['length-desc', '长到短'],
]

const FILTER_OPTIONS: ReadonlyArray<readonly [TextFilterMode, string]> = [
  ['none', '不过滤'],
  ['keep', '保留匹配'],
  ['remove', '剔除匹配'],
]

const FILTER_KINDS: ReadonlyArray<readonly [TextFilterKind, string]> = [
  ['contains', '包含'],
  ['regex', '正则'],
]

const CASE_OPTIONS: ReadonlyArray<readonly [TextCase | 'none', string]> = [['none', '保持原样'], ...TEXT_CASES]

const SAMPLE = '  ToolDock  \n\n本地处理\n文本工具\n本地处理\n  ToolDock  \n'

/** 只统计偏离默认值的选项，重置按钮才有意义 */
function countChanged(options: TextOptions): number {
  return (Object.keys(DEFAULT_TEXT_OPTIONS) as Array<keyof TextOptions>).filter((key) => options[key] !== DEFAULT_TEXT_OPTIONS[key]).length
}

interface TextPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

export default function TextPage({ tool, favorite, onFavorite }: TextPageProps) {
  const [optionTab, setOptionTab] = useState<OptionTab>('clean')
  const [options, setOptions] = useState<TextOptions>(DEFAULT_TEXT_OPTIONS)
  const [input, setInput] = useState(SAMPLE)
  const deferredInput = useDeferredValue(input)
  const { copied, copy } = useClipboard()

  const result = useMemo(() => {
    try {
      return { output: applyTextPipeline(deferredInput, options), error: '' }
    } catch (caught) {
      return { output: '', error: caught instanceof Error ? caught.message : '处理失败，请检查输入' }
    }
  }, [deferredInput, options])

  const inputStats = useMemo(() => getTextStats(deferredInput), [deferredInput])
  const outputStats = useMemo(() => getTextStats(result.output), [result.output])
  const changedCount = countChanged(options)

  function update<K extends keyof TextOptions>(key: K, value: TextOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  return (
    <ToolPageShell tool={tool} favorite={favorite} onFavorite={onFavorite} className="text-page" description="清洗、排序、大小写转换与字符统计">
      <ToolToolbar
        tabs={<Tabs items={OPTION_TABS} value={optionTab} onChange={setOptionTab} label="文本处理选项分组" />}
        controls={
          <button type="button" className="secondary-button" onClick={() => setOptions(DEFAULT_TEXT_OPTIONS)} disabled={!changedCount}>
            <RotateCcw size={14} /> 重置选项
          </button>
        }
      />
      <section className="text-options">
        {optionTab === 'clean' && (
          <>
            <Toggle label="去除每行首尾空格" checked={options.trimLines} onChange={(value) => update('trimLines', value)} />
            <Toggle label="移除空行" checked={options.removeEmpty} onChange={(value) => update('removeEmpty', value)} />
            <Toggle label="去重（保留首次出现）" checked={options.dedupe} onChange={(value) => update('dedupe', value)} />
            <span className="text-options-divider" />
            <SegmentedControl value={options.filterMode} options={FILTER_OPTIONS} onChange={(value) => update('filterMode', value)} label="行过滤模式" />
            {options.filterMode !== 'none' && (
              <>
                <SegmentedControl
                  value={options.filterKind}
                  options={FILTER_KINDS}
                  onChange={(value) => update('filterKind', value)}
                  label="匹配方式"
                  className="text-filter-kind"
                />
                <input
                  className="text-field"
                  value={options.filterValue}
                  onChange={(event) => update('filterValue', event.target.value)}
                  placeholder={options.filterKind === 'regex' ? '例如：^(http|https)' : '包含的关键字'}
                  aria-label="过滤内容"
                />
              </>
            )}
          </>
        )}
        {optionTab === 'order' && (
          <>
            <SegmentedControl value={options.sort} options={SORT_OPTIONS} onChange={(value) => update('sort', value)} label="排序方式" className="text-sort" />
            <Toggle label="反转顺序" checked={options.reverse} onChange={(value) => update('reverse', value)} />
            <span className="text-options-divider" />
            <Toggle label="添加行号" checked={options.numberLines} onChange={(value) => update('numberLines', value)} />
            <NumberField label="起始" value={options.numberStart} onChange={(value) => update('numberStart', value)} disabled={!options.numberLines} />
          </>
        )}
        {optionTab === 'case' && (
          <>
            <SegmentedControl
              value={options.textCase}
              options={CASE_OPTIONS}
              onChange={(value) => update('textCase', value)}
              label="大小写转换"
              className="text-case"
            />
          </>
        )}
        {optionTab === 'output' && (
          <>
            <TextField label="前缀" value={options.prefix} onChange={(value) => update('prefix', value)} placeholder="例如：- " />
            <TextField label="后缀" value={options.suffix} onChange={(value) => update('suffix', value)} placeholder="例如：;" />
            <TextField
              label="合并分隔符"
              value={options.joinSeparator}
              onChange={(value) => update('joinSeparator', value)}
              placeholder="留空按行输出，支持 \n \t"
              disabled={options.arrayLiteral}
              wide
            />
            <Toggle label="输出为数组字面量" checked={options.arrayLiteral} onChange={(value) => update('arrayLiteral', value)} />
          </>
        )}
      </section>
      <div className="editor-grid">
        <EditorPanel
          title="输入"
          value={input}
          placeholder="粘贴任意多行文本…"
          onChange={setInput}
          onClear={() => setInput('')}
          extra={<span> · {inputStats.nonEmptyLines} 行有效</span>}
        />
        <EditorPanel
          title="输出"
          value={result.output}
          placeholder="处理结果会实时显示在这里"
          readOnly
          error={result.error}
          copied={copied === 'output'}
          onCopy={() => copy(result.output, 'output')}
          onDownload={() => downloadText(result.output, 'text-result.txt')}
          extra={
            <span>
              {' '}
              · {outputStats.lines} 行 · {formatBytes(outputStats.bytes)}
            </span>
          }
        />
      </div>
    </ToolPageShell>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="option-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  wide,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  wide?: boolean
  disabled?: boolean
}) {
  return (
    <label className={`text-option-field ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      <input className="text-field" value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function NumberField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <label className="text-option-field">
      <span>{label}</span>
      <input className="text-field narrow" type="number" value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value) || 0)} />
    </label>
  )
}
