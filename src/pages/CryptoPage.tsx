import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Dices, Eye, EyeOff, KeyRound, ShieldCheck, Zap } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import EditorPanel from '../components/tools/EditorPanel'
import { CRYPTO_ALGORITHMS, generateRandomPassword256, transformCrypto, type CryptoAlgorithm, type CryptoMode } from '../crypto-utils'
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
    }, definition.group === '对称加密' ? 180 : 0)
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
  const isSymmetric = definition.group === '对称加密'
  const ciphertextPrefix = algorithm === 'aes' ? 'AESGCM.v1' : algorithm === 'chacha20' ? 'CHACHA20.v1' : 'SM4CBC.v1'
  return (
    <div className="content-page tool-page page-container crypto-page">
      <PageHeader icon={tool.icon} title={tool.name} description={`${definition.name} · ${definition.description} · 仅在当前浏览器处理`} color={tool.color} action={<button className={`favorite-button ${favorite ? 'active' : ''}`} onClick={onFavorite}><KeyRound size={16} /> {favorite ? '已收藏' : '收藏'}</button>} />
      <div className="crypto-toolbar">
        <div className="crypto-algorithm-tabs" role="tablist" aria-label="加密与编码算法">
          {CRYPTO_ALGORITHMS.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={algorithm === item.id} className={`${algorithm === item.id ? 'active' : ''} ${index > 0 && item.group !== CRYPTO_ALGORITHMS[index - 1].group ? 'group-start' : ''}`} onClick={() => setAlgorithm(item.id)}>{item.name}</button>)}
        </div>
        <div className="crypto-controls">
          <div className="segmented crypto-modes">{definition.modes.map(([value, label]) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>{label}</button>)}</div>
          {isSymmetric && <><label className="password-field"><span>密码</span><div><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="用于派生加密密钥" /><button type="button" onClick={() => setShowPassword((value) => !value)} title={showPassword ? '隐藏密码' : '显示密码'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label><button type="button" className="secondary-button password-generate" onClick={() => { setPassword(generateRandomPassword256()); setShowPassword(true) }} title="生成并显示 64 位十六进制密码（256 bit）"><Dices size={14} /> 随机 256 位</button></>}
          <div className="toolbar-hint"><Zap size={14} /> 输入后自动处理</div>
        </div>
      </div>
      <div className="editor-grid">
        <EditorPanel title="输入" value={input} placeholder={isSymmetric && mode === 'decrypt' ? `输入 ${ciphertextPrefix} 格式的密文…` : tool.placeholder} onChange={setInput} onClear={() => setInput('')} />
        <button className="swap-button" onClick={swap} disabled={!output || isHash} title={isHash ? '哈希摘要不可逆' : '将结果放回输入区'}><ArrowLeftRight size={17} /></button>
        <EditorPanel title={isHash ? '摘要' : '输出'} value={output} placeholder="处理结果会实时显示在这里" readOnly error={error} onCopy={copyOutput} copied={copied} />
      </div>
      <div className="shortcut-strip"><span>{isHash ? 'MD5 / SHA 是不可逆摘要，不是加密' : isSymmetric ? `${definition.name} 密文已包含随机盐和随机数，并校验完整性` : '支持中文、Emoji 与多行文本'}</span><span>·</span><span className="privacy-inline"><ShieldCheck size={13} /> 本地计算</span></div>
    </div>
  )
}
