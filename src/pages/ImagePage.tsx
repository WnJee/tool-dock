import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Download, ImagePlus, Images, Layers, Loader2, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import SegmentedControl from '../components/common/SegmentedControl'
import Tabs, { type TabItem } from '../components/common/Tabs'
import ToolPageShell from '../components/common/ToolPageShell'
import ToolToolbar from '../components/common/ToolToolbar'
import { downloadBlob } from '../lib/download'
import { formatBytes, formatPercent } from '../lib/format'
import {
  IMAGE_FORMATS,
  MAX_IMAGE_COUNT,
  buildFileName,
  extensionOf,
  getImageFormat,
  loadImageAsset,
  processImage,
  stitchImages,
  type ImageFormat,
  type Size,
  type StitchFit,
  type StitchMode,
} from '../lib/image'
import type { ToolDefinition } from '../types'

type Mode = 'compress' | 'stitch'
type OutputFormat = ImageFormat | 'keep'

interface Asset {
  id: string
  name: string
  mime: string
  url: string
  fileSize: number
  size: Size
  bitmap: ImageBitmap
}

interface OutputItem {
  id: string
  name: string
  url: string
  blob: Blob
  byteSize: number
  /** 仅压缩结果有，用于计算体积变化 */
  sourceBytes?: number
  size: Size
}

const MODES: ReadonlyArray<TabItem<Mode>> = [
  { id: 'compress', label: '压缩与转换' },
  { id: 'stitch', label: '拼接长图' },
]

const STITCH_MODES: ReadonlyArray<readonly [StitchMode, string]> = [
  ['horizontal', '横向'],
  ['vertical', '纵向'],
  ['grid', '网格'],
]

const OUTPUT_FORMATS: ReadonlyArray<readonly [OutputFormat, string]> = [
  ['keep', '保持原格式'],
  ...IMAGE_FORMATS.map((format) => [format.id, format.label] as const),
]

interface ImagePageProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
}

export default function ImagePage({ tool, favorite, onFavorite }: ImagePageProps) {
  const [mode, setMode] = useState<Mode>('compress')
  const [assets, setAssets] = useState<Asset[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [format, setFormat] = useState<OutputFormat>('keep')
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState('1920')
  const [maxHeight, setMaxHeight] = useState('')
  const [stitchMode, setStitchMode] = useState<StitchMode>('vertical')
  const [fit, setFit] = useState<StitchFit>('cover')
  const [previewScale, setPreviewScale] = useState<'fit' | 'width'>('fit')
  const [columns, setColumns] = useState('2')
  const [gap, setGap] = useState('8')
  const [padding, setPadding] = useState('0')
  const [spacing, setSpacing] = useState(true)
  const [background, setBackground] = useState('#0b0e14')
  const [outputs, setOutputs] = useState<OutputItem[]>([])
  const [stitchResult, setStitchResult] = useState<OutputItem | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)
  const assetsRef = useRef<Asset[]>([])
  const outputsRef = useRef<OutputItem[]>([])
  const stitchRef = useRef<OutputItem | undefined>(undefined)
  const aliveRef = useRef(true)
  const runRef = useRef(0)

  assetsRef.current = assets
  outputsRef.current = outputs
  stitchRef.current = stitchResult

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      // 页面卸载时释放本页创建的全部 ObjectURL 与 ImageBitmap，避免图片常驻内存
      for (const asset of assetsRef.current) {
        URL.revokeObjectURL(asset.url)
        asset.bitmap.close()
      }
      for (const item of outputsRef.current) URL.revokeObjectURL(item.url)
      if (stitchRef.current) URL.revokeObjectURL(stitchRef.current.url)
    }
  }, [])

  useEffect(() => {
    // 拖拽到页面空白处时浏览器会直接打开文件，拦截以保护当前工作区
    function blockNavigation(event: DragEvent) {
      event.preventDefault()
    }
    window.addEventListener('dragover', blockNavigation)
    window.addEventListener('drop', blockNavigation)
    return () => {
      window.removeEventListener('dragover', blockNavigation)
      window.removeEventListener('drop', blockNavigation)
    }
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith('image/'))
    if (!images.length) {
      setError('请选择图片文件')
      return
    }
    setError('')
    let count = assetsRef.current.length
    let limited = false
    for (const file of images) {
      if (count >= MAX_IMAGE_COUNT) {
        limited = true
        break
      }
      try {
        const loaded = await loadImageAsset(file)
        const asset: Asset = {
          id: crypto.randomUUID(),
          name: file.name,
          mime: file.type,
          url: loaded.url,
          fileSize: file.size,
          size: loaded.size,
          bitmap: loaded.bitmap,
        }
        count += 1
        if (!aliveRef.current) {
          URL.revokeObjectURL(asset.url)
          asset.bitmap.close()
          return
        }
        setAssets((current) => [...current, asset])
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : `无法解析 ${file.name}`)
      }
    }
    if (limited) setError(`最多支持 ${MAX_IMAGE_COUNT} 张图片，多余文件已跳过`)
  }, [])

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? [])
      if (files.length) {
        event.preventDefault()
        void addFiles(files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addFiles])

  function removeAsset(id: string) {
    if (busy) return
    const removed = assetsRef.current.find((asset) => asset.id === id)
    setAssets((current) => current.filter((asset) => asset.id !== id))
    if (!removed) return
    URL.revokeObjectURL(removed.url)
    removed.bitmap.close()
  }

  function moveAsset(id: string, offset: number) {
    setAssets((current) => {
      const index = current.findIndex((asset) => asset.id === id)
      const target = index + offset
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  function clearAssets() {
    if (busy) return
    const current = assetsRef.current
    setAssets([])
    for (const asset of current) {
      URL.revokeObjectURL(asset.url)
      asset.bitmap.close()
    }
    clearOutputs()
  }

  function clearOutputs() {
    const currentOutputs = outputsRef.current
    const currentStitch = stitchRef.current
    setOutputs([])
    setStitchResult(undefined)
    for (const item of currentOutputs) URL.revokeObjectURL(item.url)
    if (currentStitch) URL.revokeObjectURL(currentStitch.url)
  }

  function resolveFormat(mime: string): ImageFormat {
    if (format !== 'keep') return format
    return getImageFormat(mime)?.id ?? 'image/jpeg'
  }

  async function runCompress() {
    const sources = assetsRef.current
    if (!sources.length) return
    const run = ++runRef.current
    setBusy(true)
    setError('')
    const next: OutputItem[] = []
    try {
      for (const asset of sources) {
        const target = resolveFormat(asset.mime)
        const result = await processImage(asset.bitmap, asset.size, {
          maxWidth: Number(maxWidth) || 0,
          maxHeight: Number(maxHeight) || 0,
          format: target,
          quality: quality / 100,
          background: target === 'image/jpeg' ? '#ffffff' : undefined,
        })
        next.push({
          id: asset.id,
          name: buildFileName(asset.name, extensionOf(target)),
          url: URL.createObjectURL(result.blob),
          blob: result.blob,
          byteSize: result.blob.size,
          sourceBytes: asset.fileSize,
          size: result.size,
        })
      }
      if (!aliveRef.current || run !== runRef.current) {
        next.forEach((item) => URL.revokeObjectURL(item.url))
        return
      }
      const previous = outputsRef.current
      setOutputs(next)
      setStitchResult(undefined)
      if (stitchRef.current) URL.revokeObjectURL(stitchRef.current.url)
      previous.forEach((item) => URL.revokeObjectURL(item.url))
    } catch (caught) {
      // 失败时释放本轮已生成但不会展示的结果，防止 URL 悬挂
      next.forEach((item) => URL.revokeObjectURL(item.url))
      if (aliveRef.current) setError(caught instanceof Error ? caught.message : '处理失败，请重试')
    } finally {
      if (aliveRef.current) setBusy(false)
    }
  }

  async function runStitch() {
    const sources = assetsRef.current
    if (!sources.length) return
    const run = ++runRef.current
    setBusy(true)
    setError('')
    try {
      const target: ImageFormat = format === 'keep' ? 'image/png' : format
      const result = await stitchImages(
        sources.map((asset) => asset.bitmap),
        sources.map((asset) => asset.size),
        {
          mode: stitchMode,
          columns: Number(columns) || 1,
          gap: spacing ? Number(gap) || 0 : 0,
          padding: spacing ? Number(padding) || 0 : 0,
          background,
          fit,
          format: target,
          quality: quality / 100,
        },
      )
      const url = URL.createObjectURL(result.blob)
      if (!aliveRef.current || run !== runRef.current) {
        URL.revokeObjectURL(url)
        return
      }
      const previousStitch = stitchRef.current
      setStitchResult({
        id: 'stitch',
        name: buildFileName('stitch', extensionOf(target)),
        url,
        blob: result.blob,
        byteSize: result.blob.size,
        size: result.size,
      })
      if (previousStitch) URL.revokeObjectURL(previousStitch.url)
    } catch (caught) {
      if (aliveRef.current) setError(caught instanceof Error ? caught.message : '拼接失败，请重试')
    } finally {
      if (aliveRef.current) setBusy(false)
    }
  }

  async function downloadAll() {
    for (const item of outputs) {
      downloadBlob(item.blob, item.name)
      await new Promise((resolve) => window.setTimeout(resolve, 240))
    }
  }

  const lossyQuality = (format === 'keep' ? undefined : format) !== 'image/png'

  return (
    <ToolPageShell
      tool={tool}
      favorite={favorite}
      onFavorite={onFavorite}
      className={`image-page ${mode === 'stitch' ? 'is-split' : ''}`}
      description="压缩、格式转换与拼接长图"
    >
      <ToolToolbar
        tabs={<Tabs items={MODES} value={mode} onChange={setMode} label="图片处理模式" />}
        controls={
          <>
            <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()} disabled={busy}>
              <Upload size={14} /> 添加图片
            </button>
            {assets.length > 0 && (
              <button type="button" className="secondary-button" onClick={clearAssets} disabled={busy}>
                <Trash2 size={14} /> 清空列表
              </button>
            )}
          </>
        }
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <div className={`image-split ${mode === 'stitch' ? '' : 'is-single'}`}>
        <div className="image-split-left">
          <section
            className={`image-dropzone ${assets.length ? 'has-assets' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="拖入、粘贴或点击添加图片"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              void addFiles(Array.from(event.dataTransfer.files))
            }}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              inputRef.current?.click()
            }}
          >
            <ImagePlus size={22} />
            <strong>{assets.length ? '添加更多图片' : '添加图片'}</strong>
          </section>
          {assets.length > 0 && (
            <div className="image-assets">
              {assets.map((asset, index) => (
                <figure className="image-asset" key={asset.id}>
                  <span className="image-asset-index">{index + 1}</span>
                  <img src={asset.url} alt={asset.name} />
                  <figcaption>
                    <strong title={asset.name}>{asset.name}</strong>
                    <span>
                      {asset.size.width}×{asset.size.height} · {formatBytes(asset.fileSize)}
                    </span>
                  </figcaption>
                  <div className="image-asset-actions">
                    <button type="button" onClick={() => moveAsset(asset.id, -1)} disabled={busy || index === 0} title="向前移动">
                      <ArrowLeft size={13} />
                    </button>
                    <button type="button" onClick={() => moveAsset(asset.id, 1)} disabled={busy || index === assets.length - 1} title="向后移动">
                      <ArrowRight size={13} />
                    </button>
                    <button type="button" onClick={() => removeAsset(asset.id)} disabled={busy} title="移除">
                      <X size={13} />
                    </button>
                  </div>
                </figure>
              ))}
            </div>
          )}
          <section className="image-options">
            {mode === 'compress' ? (
              <>
                <label className="image-option-field">
                  <span>输出格式</span>
                  <select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)}>
                    {OUTPUT_FORMATS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="image-option-field narrow">
                  <span>最大宽度</span>
                  <input type="number" min="0" value={maxWidth} placeholder="不限制" onChange={(event) => setMaxWidth(event.target.value)} />
                </label>
                <label className="image-option-field narrow">
                  <span>最大高度</span>
                  <input type="number" min="0" value={maxHeight} placeholder="不限制" onChange={(event) => setMaxHeight(event.target.value)} />
                </label>
                {lossyQuality && (
                  <label className="image-option-field grow">
                    <span>画质 {quality}%</span>
                    <input type="range" min="20" max="100" step="1" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
                  </label>
                )}
                <button type="button" className="primary-button" onClick={runCompress} disabled={busy || !assets.length}>
                  {busy ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />} 开始处理
                </button>
              </>
            ) : (
              <>
                <div className="image-option-field">
                  <span>拼接方向</span>
                  <SegmentedControl value={stitchMode} options={STITCH_MODES} onChange={setStitchMode} label="拼接方向" />
                </div>
                {stitchMode === 'grid' && (
                  <label className="image-option-field narrow">
                    <span>列数</span>
                    <input type="number" min="1" max="8" value={columns} onChange={(event) => setColumns(event.target.value)} />
                  </label>
                )}
                {stitchMode === 'grid' && (
                  <label className="option-toggle" title="填满时等比裁剪，完整显示时保留留白">
                    <input type="checkbox" checked={fit === 'cover'} onChange={(event) => setFit(event.target.checked ? 'cover' : 'contain')} />
                    <span>填满单元格</span>
                  </label>
                )}
                <label className="option-toggle" title="关闭后完全无缝拼接">
                  <input type="checkbox" checked={spacing} onChange={(event) => setSpacing(event.target.checked)} />
                  <span>显示间距与留白</span>
                </label>
                <label className="image-option-field narrow">
                  <span>间距</span>
                  <input type="number" min="0" value={gap} disabled={!spacing} onChange={(event) => setGap(event.target.value)} />
                </label>
                <label className="image-option-field narrow">
                  <span>留白</span>
                  <input type="number" min="0" value={padding} disabled={!spacing} onChange={(event) => setPadding(event.target.value)} />
                </label>
                <label className="image-option-field">
                  <span>背景色</span>
                  <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} />
                </label>
                <label className="image-option-field">
                  <span>输出格式</span>
                  <select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)}>
                    {OUTPUT_FORMATS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {lossyQuality && (
                  <label className="image-option-field grow">
                    <span>画质 {quality}%</span>
                    <input type="range" min="20" max="100" step="1" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
                  </label>
                )}
                <button type="button" className="primary-button" onClick={runStitch} disabled={busy || !assets.length}>
                  {busy ? <Loader2 size={15} className="spin" /> : <Layers size={15} />} 生成拼接图
                </button>
              </>
            )}
          </section>
          {error && <div className="image-error">{error}</div>}
        </div>
        <div className="image-split-right">
          {mode === 'compress' ? (
            <section className="image-outputs">
              <div className="image-outputs-header">
                <strong>处理结果</strong>
                {outputs.length > 0 && (
                  <button type="button" className="secondary-button" onClick={downloadAll}>
                    <Download size={14} /> 全部下载
                  </button>
                )}
              </div>
              {outputs.length === 0 ? (
                <div className="image-empty">
                  <ImagePlus size={22} />
                </div>
              ) : (
                <div className="image-output-list">
                  {outputs.map((item) => (
                    <div className="image-output-row" key={item.id}>
                      <img src={item.url} alt={item.name} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.size.width}×{item.size.height} · {formatBytes(item.byteSize)} ·{' '}
                          {formatPercent(item.sourceBytes ? item.byteSize / item.sourceBytes - 1 : 0)}
                        </span>
                      </div>
                      <button type="button" className="icon-button subtle" onClick={() => downloadBlob(item.blob, item.name)} title="下载">
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="image-outputs image-stitch-outputs">
              <div className="image-outputs-header">
                <strong>拼接预览</strong>
                {stitchResult && (
                  <button type="button" className="secondary-button" onClick={() => downloadBlob(stitchResult.blob, stitchResult.name)}>
                    <Download size={14} /> 下载 {formatBytes(stitchResult.byteSize)}
                  </button>
                )}
              </div>
              {stitchResult ? (
                <div className="image-stitch-preview">
                  <div className={`image-stitch-frame ${previewScale === 'width' ? 'is-width' : ''}`}>
                    <img src={stitchResult.url} alt="拼接结果" />
                  </div>
                  <div className="image-stitch-meta">
                    <span>
                      {stitchResult.size.width}×{stitchResult.size.height} · {formatBytes(stitchResult.byteSize)}
                    </span>
                    <div className="image-stitch-actions">
                      <button type="button" className={previewScale === 'fit' ? 'is-active' : ''} onClick={() => setPreviewScale('fit')}>
                        完整
                      </button>
                      <button type="button" className={previewScale === 'width' ? 'is-active' : ''} onClick={() => setPreviewScale('width')}>
                        宽度
                      </button>
                      <a href={stitchResult.url} target="_blank" rel="noreferrer">
                        查看原图
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="image-empty">
                  <Images size={22} />
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </ToolPageShell>
  )
}
