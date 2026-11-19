import { describe, expect, it } from 'vitest'
import { buildFileName, computeStitchLayout, computeTargetSize, extensionOf, fitWithin, getImageFormat, MAX_CANVAS_SIDE } from './image'
import { formatBytes, formatPercent } from './format'

describe('image sizing', () => {
  it('fits inside a box without upscaling', () => {
    expect(fitWithin({ width: 4000, height: 2000 }, 1200, 1200)).toEqual({ width: 1200, height: 600 })
    expect(fitWithin({ width: 120, height: 80 }, 1200, 1200)).toEqual({ width: 120, height: 80 })
    expect(fitWithin({ width: 800, height: 1600 }, 0, 800)).toEqual({ width: 400, height: 800 })
    expect(() => fitWithin({ width: 0, height: 10 }, 100, 100)).toThrow('图片尺寸无效')
  })

  it('keeps the original size when no limits are set', () => {
    expect(computeTargetSize({ width: 640, height: 480 })).toEqual({ width: 640, height: 480 })
    expect(computeTargetSize({ width: 640, height: 480 }, 320, 0)).toEqual({ width: 320, height: 240 })
  })
})

describe('stitch layout', () => {
  it('aligns a horizontal strip on the smallest height', () => {
    const layout = computeStitchLayout(
      [
        { width: 100, height: 100 },
        { width: 200, height: 50 },
      ],
      { mode: 'horizontal', columns: 1, gap: 10, padding: 5, background: '#fff' },
    )
    expect(layout.width).toBe(270)
    expect(layout.height).toBe(60)
    expect(layout.frames).toEqual([
      { x: 5, y: 5, width: 50, height: 50 },
      { x: 65, y: 5, width: 200, height: 50 },
    ])
  })

  it('aligns a vertical strip on the smallest width', () => {
    const layout = computeStitchLayout(
      [
        { width: 100, height: 100 },
        { width: 50, height: 200 },
      ],
      { mode: 'vertical', columns: 1, gap: 0, padding: 0, background: '#fff' },
    )
    expect(layout).toMatchObject({ width: 50, height: 250 })
    expect(layout.frames[0]).toEqual({ x: 0, y: 0, width: 50, height: 50 })
    expect(layout.frames[1]).toEqual({ x: 0, y: 50, width: 50, height: 200 })
  })

  it('fills every grid cell with a centre-cropped source (cover by default)', () => {
    const layout = computeStitchLayout(
      [
        { width: 100, height: 100 },
        { width: 200, height: 100 },
        { width: 50, height: 50 },
      ],
      { mode: 'grid', columns: 2, gap: 0, padding: 0, background: '#fff' },
    )
    expect(layout).toMatchObject({ width: 400, height: 200 })
    // 单元格 200×100：同比例的不需要裁剪，竖向图裁上下，小方图裁左右
    expect(layout.frames).toEqual([
      { x: 0, y: 0, width: 200, height: 100, source: { x: 0, y: 25, width: 100, height: 50 } },
      { x: 200, y: 0, width: 200, height: 100, source: { x: 0, y: 0, width: 200, height: 100 } },
      { x: 0, y: 100, width: 200, height: 100, source: { x: 0, y: 13, width: 50, height: 25 } },
    ])
  })

  it('keeps images fully visible when fit is contain', () => {
    const layout = computeStitchLayout(
      [
        { width: 100, height: 100 },
        { width: 200, height: 100 },
        { width: 50, height: 50 },
      ],
      { mode: 'grid', columns: 2, gap: 0, padding: 0, background: '#fff', fit: 'contain' },
    )
    expect(layout.frames).toEqual([
      { x: 50, y: 0, width: 100, height: 100 },
      { x: 200, y: 0, width: 200, height: 100 },
      { x: 75, y: 125, width: 50, height: 50 },
    ])
  })

  it('rejects canvases above the hard limit', () => {
    expect(() =>
      computeStitchLayout([{ width: MAX_CANVAS_SIDE + 1, height: 10 }], { mode: 'grid', columns: 1, gap: 0, padding: 0, background: '#fff' }),
    ).toThrow('超出')
  })

  it('enforces the total pixel budget, not just the side length', () => {
    const tall = Array.from({ length: 4 }, () => ({ width: 4000, height: 4000 }))
    expect(() => computeStitchLayout(tall, { mode: 'vertical', columns: 1, gap: 0, padding: 0, background: '#fff' })).toThrow('总像素')
  })

  it('rejects degenerate source sizes instead of producing NaN', () => {
    expect(() => computeStitchLayout([{ width: 100, height: 0 }], { mode: 'horizontal', columns: 1, gap: 0, padding: 0, background: '#fff' })).toThrow(
      '画布尺寸无效',
    )
    expect(() => fitWithin({ width: 0, height: 10 }, 100, 100)).toThrow('图片尺寸无效')
  })

  it('returns an empty layout for no images', () => {
    expect(computeStitchLayout([], { mode: 'horizontal', columns: 1, gap: 0, padding: 0, background: '#fff' })).toEqual({ width: 0, height: 0, frames: [] })
  })
})

describe('image metadata helpers', () => {
  it('maps formats and builds output names', () => {
    expect(extensionOf('image/webp')).toBe('webp')
    expect(extensionOf('application/pdf')).toBe('png')
    expect(getImageFormat('image/jpeg')?.label).toBe('JPEG')
    expect(buildFileName('holiday.JPG', 'webp', '-min')).toBe('holiday-min.webp')
    expect(buildFileName('archive.v2.png', 'jpg')).toBe('archive.v2.jpg')
  })
})

describe('number formatting', () => {
  it('renders byte sizes and ratios', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024 * 3.5)).toBe('3.5 MB')
    expect(formatPercent(-0.42)).toBe('-42.0%')
    expect(formatPercent(0.125, 2)).toBe('+12.50%')
  })
})
