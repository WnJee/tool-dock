import { Check, Copy, Download, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface EditorPanelProps {
  title: string
  value: string
  placeholder: string
  readOnly?: boolean
  error?: string
  copied?: boolean
  /** 页脚附加信息，例如行数、字节数 */
  extra?: ReactNode
  onChange?: (value: string) => void
  onClear?: () => void
  onCopy?: () => void
  onDownload?: () => void
}

export default function EditorPanel({ title, value, placeholder, readOnly, error, copied, extra, onChange, onClear, onCopy, onDownload }: EditorPanelProps) {
  return (
    <div className={`editor-panel ${error ? 'has-error' : ''}`}>
      <div className="editor-header">
        <span>{title}</span>
        <div>
          {onClear && value && (
            <button type="button" onClick={onClear}>
              <Trash2 size={14} /> 清空
            </button>
          )}
          {onDownload && (
            <button type="button" onClick={onDownload} disabled={!value}>
              <Download size={14} /> 下载
            </button>
          )}
          {onCopy && (
            <button type="button" onClick={onCopy} disabled={!value}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '已复制' : '复制'}
            </button>
          )}
        </div>
      </div>
      <textarea
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={title}
        onChange={(event) => onChange?.(event.target.value)}
        spellCheck={false}
      />
      <div className="editor-footer">
        {error ? (
          <span className="error-text">{error}</span>
        ) : (
          <>
            <span>{value.length.toLocaleString()} 字符</span>
            {extra}
          </>
        )}
      </div>
    </div>
  )
}
