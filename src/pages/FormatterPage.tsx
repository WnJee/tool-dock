import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { SegmentedControl, Tabs, ToolPageShell, ToolToolbar } from '../components/common'
import EditorPanel from '../components/tools/EditorPanel'
import JsonOutputPanel, { type JsonView } from '../components/tools/JsonOutputPanel'
import { useClipboard } from '../hooks/useClipboard'
import { FORMATTERS, transformFormat, type FormatterLanguage, type FormatterMode } from '../lib/formatter'
import type { ToolDefinition } from '../types'

interface FormatterPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

const LANGUAGE_TABS = FORMATTERS.map((item) => ({ id: item.id, label: item.name }))

export default function FormatterPage({ tool, favorite, onFavorite }: FormatterPageProps) {
  const [language, setLanguage] = useState<FormatterLanguage>('json')
  const definition = useMemo(() => FORMATTERS.find((item) => item.id === language)!, [language])
  const [mode, setMode] = useState<FormatterMode>('format')
  const [input, setInput] = useState('{"name":"ToolDock","private":true,"features":["JSON","XML","HTML","JavaScript"]}')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [jsonView, setJsonView] = useState<JsonView>('tree')
  const { copied, copy } = useClipboard()

  useEffect(() => {
    setMode(definition.modes[0][0])
    setJsonView(language === 'json' ? 'tree' : 'text')
  }, [definition, language])

  useEffect(() => {
    let active = true
    if (!input.trim()) {
      setOutput('')
      setError('')
      return () => {
        active = false
      }
    }
    const timer = window.setTimeout(
      async () => {
        try {
          const result = await transformFormat(language, input, mode)
          if (active) {
            setOutput(result)
            setError('')
          }
        } catch (caught) {
          if (active) {
            setOutput('')
            setError(caught instanceof Error ? caught.message : '处理失败，请检查输入')
          }
        }
      },
      language === 'html' || language === 'javascript' ? 120 : 0,
    )
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [input, language, mode])

  useEffect(() => {
    if (language !== 'json' || mode !== 'format') setJsonView('text')
  }, [language, mode])

  function swap() {
    const inverse = getInverseMode(language, mode)
    if (!output || !inverse) return
    setInput(output)
    setMode(inverse)
  }

  const inverseMode = getInverseMode(language, mode)
  const copyOutput = () => void copy(output, 'output')
  return (
    <ToolPageShell
      tool={tool}
      favorite={favorite}
      onFavorite={onFavorite}
      className="formatter-page"
      description={`${definition.name} · ${definition.description}`}
    >
      <ToolToolbar
        tabs={<Tabs items={LANGUAGE_TABS} value={language} onChange={setLanguage} label="文件类型" className="formatter-language-tabs" />}
        controls={<SegmentedControl value={mode} options={definition.modes} onChange={setMode} label="处理方式" className="formatter-modes" />}
        className="formatter-toolbar"
        controlsClassName="formatter-controls"
      />
      <div className="editor-grid">
        <EditorPanel
          title={getInputTitle(language, mode)}
          value={input}
          placeholder={definition.placeholder}
          onChange={setInput}
          onClear={() => setInput('')}
        />
        <button
          className="swap-button"
          onClick={swap}
          disabled={!output || !inverseMode}
          title={inverseMode ? '将结果放回输入区并切换方向' : '当前操作无反向模式'}
        >
          <ArrowLeftRight size={17} />
        </button>
        {language === 'json' && mode === 'format' && output && !error ? (
          <JsonOutputPanel value={output} view={jsonView} onView={setJsonView} onCopy={copyOutput} copied={copied === 'output'} />
        ) : (
          <EditorPanel
            title={getOutputTitle(language, mode)}
            value={output}
            placeholder="处理结果会实时显示在这里"
            readOnly
            error={error}
            onCopy={copyOutput}
            copied={copied === 'output'}
          />
        )}
      </div>
    </ToolPageShell>
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
