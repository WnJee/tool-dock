import { Check, Copy, Trash2 } from 'lucide-react'

interface EditorPanelProps {
  title: string
  value: string
  placeholder: string
  readOnly?: boolean
  error?: string
  copied?: boolean
  onChange?: (value: string) => void
  onClear?: () => void
  onCopy?: () => void
}

export default function EditorPanel({ title, value, placeholder, readOnly, error, copied, onChange, onClear, onCopy }: EditorPanelProps) {
  return (
    <div className={`editor-panel ${error ? 'has-error' : ''}`}>
      <div className="editor-header"><span>{title}</span><div>{onClear && value && <button onClick={onClear}><Trash2 size={14} /> 清空</button>}{onCopy && <button onClick={onCopy} disabled={!value}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '已复制' : '复制'}</button>}</div></div>
      <textarea value={value} readOnly={readOnly} placeholder={placeholder} onChange={(event) => onChange?.(event.target.value)} spellCheck={false} />
      <div className="editor-footer">{error ? <span className="error-text">{error}</span> : <span>{value.length.toLocaleString()} 字符</span>}</div>
    </div>
  )
}
