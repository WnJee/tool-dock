import CopyStatus from './CopyStatus'

interface TimestampOutputPanelProps {
  value: string
  copied: boolean
  onCopy: () => void
}

export default function TimestampOutputPanel({ value, copied, onCopy }: TimestampOutputPanelProps) {
  const rows = value.split('\n').map((line) => {
    const separator = line.indexOf('\t')
    return separator === -1 ? ['', line] : [line.slice(0, separator), line.slice(separator + 1)]
  })
  return (
    <div className="editor-panel timestamp-panel">
      <div className="editor-header"><span>输出</span><div><button onClick={onCopy}><CopyStatus copied={copied} /></button></div></div>
      <div className="timestamp-output">{rows.map(([label, rowValue]) => <div className="timestamp-row" key={label}><span>{label}</span><code>{rowValue}</code></div>)}</div>
      <div className="editor-footer"><span>{value.length.toLocaleString()} 字符</span></div>
    </div>
  )
}
