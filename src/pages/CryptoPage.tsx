import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Eye, EyeOff, KeyRound, ShieldCheck, Zap } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import EditorPanel from '../components/tools/EditorPanel'
import { CRYPTO_ALGORITHMS, transformCrypto, type CryptoAlgorithm, type CryptoMode } from '../crypto-utils'
import type { ToolDefinition } from '../types'

interface CryptoPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

export default function CryptoPage({ tool, favorite, onFavorite }: CryptoPageProps) {
  const [algorithm, setAlgorithm] = useState<CryptoAlgorithm>('base64')
  const definition = useMemo(() => CRYPTO_ALGORITHMS.find((item) => item.id === algorithm)!, [algorithm])
  const [mode, setMode] = useState<CryptoMode>('encode')
  const [input, setInput] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => setMode(definition.modes[0][0]), [definition])

  useEffect(() => {
    let active = true
    if (!input.trim()) {
      setOutput('')
      setError('')
      return () => { active = false }
    }
    const timer = window.setTimeout(async () => {
      try {
        const result = await transformCrypto(algorithm, input, mode, password)
        if (active) { setOutput(result); setError('') }
      } catch (caught) {
        if (active) { setOutput(''); setError(caught instanceof Error ? caught.message : '处理失败，请检查输入') }
      }
    }, algorithm === 'aes' ? 180 : 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [algorithm, input, mode, password])

  async function copyOutput() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  function swap() {
    if (!output || definition.modes.length < 2) return
    setInput(output)
    setMode(mode === 'encode' ? 'decode' : mode === 'encrypt' ? 'decrypt' : definition.modes[0][0])
  }

  const isHash = definition.group === '哈希摘要'
  const isAes = algorithm === 'aes'
  return (
    <div className="content-page tool-page page-container crypto-page">
      <PageHeader icon={tool.icon} title={tool.name} description={`${definition.name} · ${definition.description} · 仅在当前浏览器处理`} color={tool.color} action={<button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={onFavorite}><KeyRound size={16} /> {favorite ? '已收藏' : '收藏'}</button>} />
      <div className="crypto-toolbar">
        <div className="crypto-algorithm-tabs" role="tablist" aria-label="加密与编码算法">
          {CRYPTO_ALGORITHMS.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={algorithm === item.id} className={`${algorithm === item.id ? 'active' : ''} ${index > 0 && item.group !== CRYPTO_ALGORITHMS[index - 1].group ? 'group-start' : ''}`} onClick={() => setAlgorithm(item.id)}>{item.name}</button>)}
        </div>
        <div className="crypto-controls">
          <div className="segmented crypto-modes">{definition.modes.map(([value, label]) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}</div>
          {isAes && <label className="password-field"><span>密码</span><div><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="用于派生 AES-256 密钥" /><button type="button" onClick={() => setShowPassword((value) => !value)} title={showPassword ? '隐藏密码' : '显示密码'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>}
          <div className="toolbar-hint"><Zap size={14} /> 输入后自动处理</div>
        </div>
      </div>
      <div className="editor-grid">
        <EditorPanel title="输入" value={input} placeholder={isAes && mode === 'decrypt' ? '输入 AESGCM.v1 格式的密文…' : tool.placeholder} onChange={setInput} onClear={() => setInput('')} />
        <button className="swap-button" onClick={swap} disabled={!output || isHash} title={isHash ? '哈希摘要不可逆' : '将结果放回输入区'}><ArrowLeftRight size={17} /></button>
        <EditorPanel title={isHash ? '摘要' : '输出'} value={output} placeholder="处理结果会实时显示在这里" readOnly error={error} onCopy={copyOutput} copied={copied} />
      </div>
      <div className="shortcut-strip"><span>{isHash ? 'MD5 / SHA 是不可逆摘要，不是加密' : isAes ? 'AES-GCM 密文已包含随机盐和 IV' : '支持中文、Emoji 与多行文本'}</span><span>·</span><span className="privacy-inline"><ShieldCheck size={13} /> 本地计算</span></div>
    </div>
  )
}
