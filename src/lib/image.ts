export interface Size {
  width: number
  height: number
}

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ImageFormatDefinition {
  id: ImageFormat
  label: string
  extension: string
}

export type StitchMode = 'horizontal' | 'vertical' | 'grid'

export interface StitchOptions {
  mode: StitchMode
  columns: number
  gap: number
  padding: number
  background: string
  /** 网格模式下统一单元格的填充方式，默认 cover（填满单元格并居中裁剪） */
  fit?: StitchFit
}

export interface StitchFrame extends Size {
  x: number
  y: number
  /** 需要从源图像素里裁剪的区域（网格填满模式下居中裁剪） */
  source?: Size & { x: number; y: number }
}

export type StitchFit = 'cover' | 'contain'

export interface StitchLayout {
  width: number
  height: number
  frames: StitchFrame[]
}

export interface ProcessOptions {
  maxWidth?: number
  maxHeight?: number
  format: ImageFormat
  /** 0 - 1 */
  quality: number
  background?: string
}

export interface ProcessResult {
  blob: Blob
  size: Size
}

export const IMAGE_FORMATS: ReadonlyArray<ImageFormatDefinition> = [
  { id: 'image/jpeg', label: 'JPEG', extension: 'jpg' },
  { id: 'image/png', label: 'PNG', extension: 'png' },
  { id: 'image/webp', label: 'WebP', extension: 'webp' },
]

/** 单边上限，兼容 Chrome / Firefox 的最大画布边长 */
export const MAX_CANVAS_SIDE = 16384
/** 总像素上限，取 iOS Safari 的安全阈值（16.7M），避免 toBlob 静默返回空图 */
export const MAX_CANVAS_PIXELS = 16_777_216
export const MAX_IMAGE_COUNT = 24
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024

export function getImageFormat(mime: string): ImageFormatDefinition | undefined {
  return IMAGE_FORMATS.find((format) => format.id === mime)
}

export function extensionOf(mime: string): string {
  return getImageFormat(mime)?.extension ?? 'png'
}

/** 等比缩放到目标框内，且绝不放大原图 */
export function fitWithin(size: Size, maxWidth: number, maxHeight: number): Size {
  if (size.width <= 0 || size.height <= 0 || !Number.isFinite(size.width) || !Number.isFinite(size.height)) throw new Error('图片尺寸无效')
  const widthLimit = maxWidth > 0 ? maxWidth : Number.POSITIVE_INFINITY
  const heightLimit = maxHeight > 0 ? maxHeight : Number.POSITIVE_INFINITY
  const scale = Math.min(1, widthLimit / size.width, heightLimit / size.height)
  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) }
}

export function computeTargetSize(size: Size, maxWidth = 0, maxHeight = 0): Size {
  if (!maxWidth && !maxHeight) return { width: size.width, height: size.height }
  return fitWithin(size, maxWidth, maxHeight)
}

function assertCanvasSize(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('画布尺寸无效，请检查图片与拼接参数')
  }
  if (width > MAX_CANVAS_SIDE || height > MAX_CANVAS_SIDE) {
    throw new Error(`画布边长 ${width}×${height} 超出 ${MAX_CANVAS_SIDE}px 上限，请减少图片数量或缩小尺寸`)
  }
  if (width * height > MAX_CANVAS_PIXELS) {
    throw new Error(`画布总像素 ${width}×${height} 超出 ${MAX_CANVAS_PIXELS / 1_000_000}M 像素上限，请减少图片数量或缩小尺寸`)
  }
}

/**
 * 纯函数布局计算：横向按最小高度对齐、纵向按最小宽度对齐，网格使用统一单元格。
 * 网格默认 cover（等比例放大到填满单元格、居中裁剪），也可选 contain（完整显示、居中留白）。
 * 所有绘制区域（frames）都是最终像素坐标；带 source 的 frame 表示需要从源图裁剪后再绘制。
 */
export function computeStitchLayout(sizes: Size[], options: StitchOptions): StitchLayout {
  if (!sizes.length) return { width: 0, height: 0, frames: [] }
  const padding = Math.max(0, Math.round(options.padding))
  const gap = Math.max(0, Math.round(options.gap))

  if (options.mode === 'horizontal') {
    const cross = Math.min(...sizes.map((size) => size.height))
    const scaled = sizes.map((size) => ({ width: Math.round((size.width * cross) / size.height), height: cross }))
    const width = padding * 2 + scaled.reduce((total, item) => total + item.width, 0) + gap * (sizes.length - 1)
    const height = padding * 2 + cross
    assertCanvasSize(width, height)
    let cursor = padding
    const frames = scaled.map((item) => {
      const frame = { x: cursor, y: padding, width: item.width, height: item.height }
      cursor += item.width + gap
      return frame
    })
    return { width, height, frames }
  }

  if (options.mode === 'vertical') {
    const cross = Math.min(...sizes.map((size) => size.width))
    const scaled = sizes.map((size) => ({ width: cross, height: Math.round((size.height * cross) / size.width) }))
    const width = padding * 2 + cross
    const height = padding * 2 + scaled.reduce((total, item) => total + item.height, 0) + gap * (sizes.length - 1)
    assertCanvasSize(width, height)
    let cursor = padding
    const frames = scaled.map((item) => {
      const frame = { x: padding, y: cursor, width: item.width, height: item.height }
      cursor += item.height + gap
      return frame
    })
    return { width, height, frames }
  }

  const columns = Math.min(Math.max(Math.round(options.columns) || 1, 1), sizes.length)
  const rows = Math.ceil(sizes.length / columns)
  const fit = options.fit ?? 'cover'
  const cellWidth = Math.max(...sizes.map((size) => size.width))
  const cellHeight = Math.max(...sizes.map((size) => size.height))
  const width = padding * 2 + cellWidth * columns + gap * (columns - 1)
  const height = padding * 2 + cellHeight * rows + gap * (rows - 1)
  assertCanvasSize(width, height)
  const frames = sizes.map((size, index) => {
    const x = padding + (index % columns) * (cellWidth + gap)
    const y = padding + Math.floor(index / columns) * (cellHeight + gap)
    if (fit === 'cover') {
      // 等比缩放到恰好覆盖单元格，居中裁掉多余部分，单元格内不留白
      const scale = Math.max(cellWidth / size.width, cellHeight / size.height)
      const cropWidth = Math.min(size.width, Math.max(1, Math.round(cellWidth / scale)))
      const cropHeight = Math.min(size.height, Math.max(1, Math.round(cellHeight / scale)))
      return {
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        source: {
          x: Math.round((size.width - cropWidth) / 2),
          y: Math.round((size.height - cropHeight) / 2),
          width: cropWidth,
          height: cropHeight,
        },
      }
    }
    const box = fitWithin(size, cellWidth, cellHeight)
    return {
      x: x + Math.round((cellWidth - box.width) / 2),
      y: y + Math.round((cellHeight - box.height) / 2),
      width: box.width,
      height: box.height,
    }
  })
  return { width, height, frames }
}

export function buildFileName(name: string, extension: string, suffix = ''): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'image'
  return `${base}${suffix}.${extension}`
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  assertCanvasSize(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function paintBackground(context: CanvasRenderingContext2D, width: number, height: number, background?: string) {
  if (!background) return
  context.fillStyle = background
  context.fillRect(0, 0, width, height)
}

export async function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality = 0.85): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, format, format === 'image/png' ? undefined : quality)
  })
  if (!blob) throw new Error('图片编码失败，请减少图片数量、缩小尺寸或更换格式')
  // 部分浏览器（旧 Safari）没有 WebP 编码器，会静默回退到 PNG，此时必须提示而不是给出错误扩展名
  if (blob.type && blob.type !== format) throw new Error(`当前浏览器无法导出 ${getImageFormat(format)?.label ?? format}，请改用 JPEG 或 PNG`)
  return blob
}

export async function loadImageAsset(file: File): Promise<{ bitmap: ImageBitmap; size: Size; url: string }> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`单张图片不能超过 ${MAX_IMAGE_BYTES / 1024 / 1024}MB`)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    assertCanvasSize(bitmap.width, bitmap.height)
    return { bitmap, size: { width: bitmap.width, height: bitmap.height }, url: URL.createObjectURL(file) }
  } catch (caught) {
    bitmap.close()
    throw caught
  }
}

export async function processImage(source: CanvasImageSource, sourceSize: Size, options: ProcessOptions): Promise<ProcessResult> {
  const size = computeTargetSize(sourceSize, options.maxWidth, options.maxHeight)
  const canvas = createCanvas(size.width, size.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器不支持 Canvas 2D 上下文')
  paintBackground(context, size.width, size.height, options.background)
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, size.width, size.height)
  return { blob: await canvasToBlob(canvas, options.format, options.quality), size }
}

export async function stitchImages(
  sources: CanvasImageSource[],
  sizes: Size[],
  options: StitchOptions & { format: ImageFormat; quality: number },
): Promise<ProcessResult> {
  const layout = computeStitchLayout(sizes, options)
  if (!layout.frames.length) throw new Error('请先添加要拼接的图片')
  const canvas = createCanvas(layout.width, layout.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器不支持 Canvas 2D 上下文')
  paintBackground(context, layout.width, layout.height, options.background)
  context.imageSmoothingQuality = 'high'
  layout.frames.forEach((frame, index) => {
    const source = sources[index]
    if (frame.source) {
      context.drawImage(source, frame.source.x, frame.source.y, frame.source.width, frame.source.height, frame.x, frame.y, frame.width, frame.height)
      return
    }
    context.drawImage(source, frame.x, frame.y, frame.width, frame.height)
  })
  return { blob: await canvasToBlob(canvas, options.format, options.quality), size: { width: layout.width, height: layout.height } }
}
