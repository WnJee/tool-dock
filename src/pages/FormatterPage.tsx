import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Braces, ShieldCheck, Star, Zap } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import EditorPanel from '../components/tools/EditorPanel'
import JsonOutputPanel, { type JsonView } from '../components/tools/JsonOutputPanel'
import { FORMATTERS, transformFormat, type FormatterLanguage, type FormatterMode } from '../formatter-utils'
import type { ToolDefinition } from '../types'

interface FormatterPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

export default function FormatterPage({ tool, favorite, onFavorite }: FormatterPageProps) {
  const [language, setLanguage] = useState<FormatterLanguage>('json')
  const definition = useMemo(() => FORMATTERS.find((item) => item.id === language)!, [language])
  const [mode, setMode] = useState<FormatterMode>('format')
  const [input, setInput] = useState('{"name":"ToolDock","private":true,"features":["JSON","XML","HTML","JavaScript"]}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [jsonView, setJsonView] = useState<JsonView>('tree')

  useEffect(() => {
    setMode(definition.modes[0][0])
    setJsonView(language === 'json' ? 'tree' : 'text')
  }, [definition, language])

  useEffect(() => {
    let active = true
    if (!input.trim()) {
      setOutput('')
      setError('')
      return () => { active = false }
    }
    const timer = window.setTimeout(async () => {
      try {
        const result = await transformFormat(language, input, mode)
        if (active) { setOutput(result); setError('') }
      } catch (caught) {
        if (active) { setOutput(''); setError(caught instanceof Error ? caught.message : '处理失败，请检查输入') }
      }
    }, language === 'html' || language === 'javascript' ? 120 : 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [input, language, mode])

  useEffect(() => {
    if (language !== 'json' || mode !== 'format') setJsonView('text')
  }, [language, mode])

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  function swap() {
    const inverse = getInverseMode(language, mode)
    if (!output || !inverse) return
    setInput(output)
    setMode(inverse)
  }

  const inverseMode = getInverseMode(language, mode)
  const favoriteAction = <button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={onFavorite}><Star size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? '已收藏' : '收藏'}</button>
  return (
    <div className="content-page tool-page page-container formatter-page">
      <PageHeader icon={tool.icon} title={tool.name} description={`${definition.name} · ${definition.description} · 仅在当前浏览器处理`} color={tool.color} action={favoriteAction} />
      <div className="crypto-toolbar formatter-toolbar">
        <div className="crypto-algorithm-tabs formatter-language-tabs" role="tablist" aria-label="文件类型">
          {FORMATTERS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={language === item.id} className={language === item.id ? 'active' : ''} onClick={() => setLanguage(item.id)}>{item.name}</button>)}
        </div>
        <div className="crypto-controls formatter-controls">
          <div className="segmented formatter-modes">{definition.modes.map(([value, label]) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}</div>
          <div className="toolbar-hint"><Zap size={14} /> 输入后自动处理</div>
        </div>
      </div>
      <div className="editor-grid">
        <EditorPanel title={getInputTitle(language, mode)} value={input} placeholder={definition.placeholder} onChange={setInput} onClear={() => setInput('')} />
        <button className="swap-button" onClick={swap} disabled={!output || !inverseMode} title={inverseMode ? '将结果放回输入区并切换方向' : '当前操作无反向模式'}><ArrowLeftRight size={17} /></button>
        {language === 'json' && mode === 'format' && output && !error ? <JsonOutputPanel value={output} view={jsonView} onView={setJsonView} onCopy={copyOutput} copied={copied} /> : <EditorPanel title={getOutputTitle(language, mode)} value={output} placeholder="处理结果会实时显示在这里" readOnly error={error} onCopy={copyOutput} copied={copied} />}
      </div>
      <div className="shortcut-strip"><span><Braces size={13} /> {language === 'yaml-properties' ? '嵌套路径使用点号，数组使用 [0]' : '格式化前会执行语法校验'}</span><span>·</span><span className="privacy-inline"><ShieldCheck size={13} /> 本地计算</span></div>
    </div>
  )
}

function getInverseMode(language: FormatterLanguage, mode: FormatterMode): FormatterMode | undefined {
  if (language === 'json') {
    if (mode === 'format') return 'minify'
    if (mode === 'minify') return 'format'
    if (mode === 'escape') return 'unescape'
    return mode === 'unescape' ? 'escape' : undefined
  }
  if (language === 'xml') return mode === 'format' ? 'minify' : 'format'
  if (language === 'yaml-properties') return mode === 'yaml-to-properties' ? 'properties-to-yaml' : 'yaml-to-properties'
  return undefined
}

function getInputTitle(language: FormatterLanguage, mode: FormatterMode): string {
  if (language === 'yaml-properties') return mode === 'yaml-to-properties' ? 'YAML 输入' : 'Properties 输入'
  return '输入'
}

function getOutputTitle(language: FormatterLanguage, mode: FormatterMode): string {
  if (language === 'yaml-properties') return mode === 'yaml-to-properties' ? 'Properties 输出' : 'YAML 输出'
  if (language === 'json' && mode === 'escape') return '转义结果'
  if (language === 'json' && mode === 'unescape') return '反转义结果'
  return '输出'
}
