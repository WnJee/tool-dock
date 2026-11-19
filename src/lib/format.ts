const SIZE_UNITS = ['KB', 'MB', 'GB'] as const

export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(fractionDigits)} ${SIZE_UNITS[unitIndex]}`
}

export function formatPercent(ratio: number, fractionDigits = 1): string {
  if (!Number.isFinite(ratio)) return '—'
  const percent = ratio * 100
  return `${percent > 0 ? '+' : ''}${percent.toFixed(fractionDigits)}%`
}

export function formatCount(value: number): string {
  return value.toLocaleString('zh-CN')
}
