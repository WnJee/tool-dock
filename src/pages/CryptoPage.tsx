import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Dices, Eye, EyeOff } from 'lucide-react'
import { SegmentedControl, Tabs, ToolPageShell, ToolToolbar } from '../components/common'
import EditorPanel from '../components/tools/EditorPanel'
import { useClipboard } from '../hooks/useClipboard'
import { CRYPTO_ALGORITHMS, generateRandomPassword256, transformCrypto, type CryptoAlgorithm, type CryptoMode } from '../lib/crypto'
import type { ToolDefinition } from '../types'

interface CryptoPageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

const ALGORITHM_TABS = CRYPTO_ALGORITHMS.map((item) => ({ id: item.id, label: item.name, group: item.group }))

export default function CryptoPage({ tool, favorite, onFavorite }: CryptoPageProps) {
  const [algorithm, setAlgorithm] = useState<CryptoAlgorithm>('base64')
  const definition = useMemo(() => CRYPTO_ALGORITHMS.find((item) => item.id === algorithm)!, [algorithm])
  const [mode, setMode] = useState<CryptoMode>('decode')
  const [input, setInput] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const { copied, copy } = useClipboard()

  useEffect(() => setMode(definition.modes.find(([value]) => value === 'decode')?.[0] ?? definition.modes[0][0]), [definition])

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
          const result = await transformCrypto(algorithm, input, mode, password)
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
      definition.group === '对称加密' ? 180 : 0,
    )
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [algorithm, input, mode, password])

  function swap() {
    if (!output || definition.modes.length < 2) return
    setInput(output)
    setMode(mode === 'encode' ? 'decode' : mode === 'encrypt' ? 'decrypt' : definition.modes[0][0])
  }

  const isHash = definition.group === '哈希摘要'
  const isSymmetric = definition.group === '对称加密'
  const ciphertextPrefix = algorithm === 'aes' ? 'AESGCM.v1' : algorithm === 'chacha20' ? 'CHACHA20.v1' : 'SM4CBC.v1'
  return (
    <ToolPageShell
      tool={tool}
      favorite={favorite}
      onFavorite={onFavorite}
      className="crypto-page"
      description={`${definition.name} · ${definition.description}`}
    >
      <ToolToolbar
        tabs={<Tabs items={ALGORITHM_TABS} value={algorithm} onChange={setAlgorithm} label="加密与编码算法" />}
        controls={
          <>
            <SegmentedControl value={mode} options={definition.modes} onChange={setMode} label="处理方向" className="crypto-modes" />
            {isSymmetric && (
              <>
                <label className="password-field">
                  <span>密码</span>
                  <div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="用于派生加密密钥"
                    />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} title={showPassword ? '隐藏密码' : '显示密码'}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>
                <button
                  type="button"
                  className="secondary-button password-generate"
                  onClick={() => {
                    setPassword(generateRandomPassword256())
                    setShowPassword(true)
                  }}
                  title="生成并显示 64 位十六进制密码（256 bit）"
                >
                  <Dices size={14} /> 随机 256 位
                </button>
              </>
            )}
          </>
        }
      />
      <div className="editor-grid">
        <EditorPanel
          title="输入"
          value={input}
          placeholder={isSymmetric && mode === 'decrypt' ? `输入 ${ciphertextPrefix} 格式的密文…` : tool.placeholder}
          onChange={setInput}
          onClear={() => setInput('')}
        />
        <button className="swap-button" onClick={swap} disabled={!output || isHash} title={isHash ? '哈希摘要不可逆' : '将结果放回输入区'}>
          <ArrowLeftRight size={17} />
        </button>
        <EditorPanel
          title={isHash ? '摘要' : '输出'}
          value={output}
          placeholder="处理结果会实时显示在这里"
          readOnly
          error={error}
          onCopy={() => void copy(output, 'output')}
          copied={copied === 'output'}
        />
      </div>
    </ToolPageShell>
  )
}
