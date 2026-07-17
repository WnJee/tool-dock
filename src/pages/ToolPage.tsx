import { useEffect, useState } from 'react'
import { ArrowLeftRight, ShieldCheck, Star, Zap } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import EditorPanel from '../components/tools/EditorPanel'
import JsonOutputPanel, { type JsonView } from '../components/tools/JsonOutputPanel'
import TimestampOutputPanel from '../components/tools/TimestampOutputPanel'
import type { ToolDefinition } from '../types'
import { decodeBase58, decodeBase64, encodeBase58, encodeBase64, formatJson, formatTimestamp, minifyJson } from '../utils'

type ToolMode = 'encode' | 'decode' | 'format' | 'minify'

interface ToolPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

export default function ToolPage({ tool, favorite, onFavorite }: ToolPageProps) {
  const [input, setInput] = useState(tool.id === 'json' ? '{"name":"ToolDock","private":true,"features":["Base64","Base58","JSON"]}' : '')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<ToolMode>(tool.id === 'json' ? 'format' : 'encode')
  const [jsonView, setJsonView] = useState<JsonView>('tree')

  useEffect(() => {
    if (tool.id === 'json') {
      setMode('format')
      setJsonView('tree')
    } else {
      setMode('encode')
    }
  }, [tool.id])

  useEffect(() => {
    if (tool.id === 'json') setJsonView(mode === 'format' ? 'tree' : 'text')
  }, [mode, tool.id])

  useEffect(() => {
    if (!input.trim()) {
      setOutput('')
      setError('')
      return
    }
    try {
      setOutput(transformInput(tool.id, input, mode))
      setError('')
    } catch (caught) {
      setOutput('')
      setError(caught instanceof Error ? caught.message : '处理失败，请检查输入')
    }
  }, [input, mode, tool.id])

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  function swap() {
    if (!output) return
    setInput(output)
    if (tool.id !== 'json' && tool.id !== 'timestamp') setMode(mode === 'encode' ? 'decode' : 'encode')
  }

  const modes = getModes(tool.id)
  const favoriteAction = <button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={onFavorite}><Star size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? '已收藏' : '收藏'}</button>
  return (
    <div className="content-page tool-page page-container">
      <PageHeader icon={tool.icon} title={tool.name} description={`${tool.description} · 输入内容仅在当前浏览器处理`} color={tool.color} action={favoriteAction} />
      <div className="tool-toolbar">
        <div className="segmented">{modes.map(([value, label]) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}{tool.id === 'timestamp' && <span className="single-mode">智能识别</span>}</div>
        <div className="toolbar-hint"><Zap size={14} /> 输入后自动处理</div>
      </div>
      <div className="editor-grid">
        <EditorPanel title="输入" value={input} placeholder={tool.placeholder} onChange={setInput} onClear={() => setInput('')} />
        <button className="swap-button" onClick={swap} disabled={!output || tool.id === 'timestamp'} title="将结果放回输入区"><ArrowLeftRight size={17} /></button>
        {renderOutputPanel(tool.id, mode, output, error, copied, jsonView, setJsonView, copyOutput)}
      </div>
      <div className="shortcut-strip"><span><kbd>⌘</kbd><kbd>K</kbd> 搜索工具</span><span>·</span><span>支持中文、Emoji 与多行文本</span><span>·</span><span className="privacy-inline"><ShieldCheck size={13} /> 本地计算</span></div>
    </div>
  )
}

function transformInput(toolId: ToolDefinition['id'], input: string, mode: ToolMode): string {
  if (toolId === 'base64') return mode === 'encode' ? encodeBase64(input) : decodeBase64(input)
  if (toolId === 'base58') return mode === 'encode' ? encodeBase58(input) : decodeBase58(input)
  if (toolId === 'json') return mode === 'minify' ? minifyJson(input) : formatJson(input)
  if (toolId === 'url') return mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
  return formatTimestamp(input)
}

function getModes(toolId: ToolDefinition['id']): Array<[ToolMode, string]> {
  if (toolId === 'json') return [['format', '格式化'], ['minify', '压缩']]
  if (toolId === 'timestamp') return []
  return [['encode', '编码'], ['decode', '解码']]
}

function renderOutputPanel(toolId: ToolDefinition['id'], mode: ToolMode, output: string, error: string, copied: boolean, jsonView: JsonView, setJsonView: (view: JsonView) => void, copyOutput: () => void) {
  if (toolId === 'json' && mode === 'format' && output && !error) return <JsonOutputPanel value={output} view={jsonView} onView={setJsonView} onCopy={copyOutput} copied={copied} />
  if (toolId === 'timestamp' && output && !error) return <TimestampOutputPanel value={output} onCopy={copyOutput} copied={copied} />
  return <EditorPanel title="输出" value={output} placeholder="处理结果会实时显示在这里" readOnly error={error} onCopy={copyOutput} copied={copied} />
}
