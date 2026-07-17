import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import CopyStatus from './CopyStatus'

export type JsonView = 'tree' | 'text'
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

interface JsonOutputPanelProps {
  value: string
  view: JsonView
  copied: boolean
  onView: (view: JsonView) => void
  onCopy: () => void
}

export default function JsonOutputPanel({ value, view, copied, onView, onCopy }: JsonOutputPanelProps) {
  const parsed = useMemo(() => JSON.parse(value) as JsonValue, [value])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const expandablePaths = useMemo(() => collectExpandablePaths(parsed), [parsed])

  function togglePath(path: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div className="editor-panel json-output-panel">
      <div className="editor-header json-output-header">
        <div className="output-view-tabs"><button className={view === 'tree' ? 'active' : ''} onClick={() => onView('tree')}>树形</button><button className={view === 'text' ? 'active' : ''} onClick={() => onView('text')}>文本</button></div>
        <div>{view === 'tree' && <><button onClick={() => setCollapsed(new Set())}><ChevronsUpDown size={14} /> 展开全部</button><button onClick={() => setCollapsed(new Set(expandablePaths))}><ChevronsDownUp size={14} /> 收起全部</button></>}<button onClick={onCopy}><CopyStatus copied={copied} /></button></div>
      </div>
      {view === 'tree' ? <div className="json-tree"><JsonTreeNode value={parsed} path="$" collapsed={collapsed} onToggle={togglePath} /></div> : <textarea value={value} readOnly spellCheck={false} />}
      <div className="editor-footer"><span>{value.length.toLocaleString()} 字符 · {expandablePaths.length.toLocaleString()} 个可折叠层级</span></div>
    </div>
  )
}

function isJsonContainer(value: JsonValue): value is JsonValue[] | { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object'
}

function collectExpandablePaths(value: JsonValue, path = '$'): string[] {
  if (!isJsonContainer(value)) return []
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value)
  return [path, ...entries.flatMap(([key, item]) => collectExpandablePaths(item, `${path}.${key}`))]
}

interface JsonTreeNodeProps {
  value: JsonValue
  name?: string
  path: string
  collapsed: Set<string>
  onToggle: (path: string) => void
}

function JsonTreeNode({ value, name, path, collapsed, onToggle }: JsonTreeNodeProps) {
  const prefix = name === undefined ? null : <span className="json-key">{JSON.stringify(name)}<em>:</em></span>
  if (!isJsonContainer(value)) {
    const type = value === null ? 'null' : typeof value
    const displayValue = value === null ? 'null' : typeof value === 'string' ? JSON.stringify(value) : String(value)
    return <div className="json-leaf">{prefix}<span className={`json-${type}`}>{displayValue}</span></div>
  }

  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value)
  const isCollapsed = collapsed.has(path)
  const open = Array.isArray(value) ? '[' : '{'
  const close = Array.isArray(value) ? ']' : '}'
  return (
    <div className="json-branch">
      <div className="json-branch-line">
        <button aria-label={`${isCollapsed ? '展开' : '收起'} ${name ?? '根节点'}`} onClick={() => onToggle(path)}>{isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>
        {prefix}<span className="json-bracket">{open}</span>
        {isCollapsed && <><button className="json-ellipsis" onClick={() => onToggle(path)}>…</button><span className="json-count">{entries.length} 项</span><span className="json-bracket">{close}</span></>}
      </div>
      {!isCollapsed && <><div className="json-children">{entries.map(([key, item]) => <JsonTreeNode key={`${path}.${key}`} value={item} name={key} path={`${path}.${key}`} collapsed={collapsed} onToggle={onToggle} />)}</div><div className="json-close">{close}</div></>}
    </div>
  )
}
