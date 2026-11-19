export interface TimestampValue {
  id: string
  label: string
  value: string
}

export type TimestampUnit = 'days' | 'hours' | 'minutes' | 'seconds'

const UNIT_MILLISECONDS: Record<TimestampUnit, number> = {
  days: 86_400_000,
  hours: 3_600_000,
  minutes: 60_000,
  seconds: 1000,
}

export function parseTimestampInput(value: string): Date {
  const raw = value.trim()
  if (!raw) throw new Error('请输入时间或时间戳')
  if (/^-?\d+$/.test(raw)) return parseNumericTimestamp(raw)

  const localMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(?:\.(\d{1,3}))?)?$/)
  if (localMatch) {
    const [, year, month, day, hour = '0', minute = '0', second = '0', millisecond = '0'] = localMatch
    const parts = [year, month, day, hour, minute, second].map(Number)
    const date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5], Number(millisecond.padEnd(3, '0')))
    const matchesInput =
      date.getFullYear() === parts[0] &&
      date.getMonth() === parts[1] - 1 &&
      date.getDate() === parts[2] &&
      date.getHours() === parts[3] &&
      date.getMinutes() === parts[4] &&
      date.getSeconds() === parts[5]
    if (!matchesInput) throw new Error('日期或时间超出有效范围')
    return date
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) throw new Error('无法识别该内容，请输入 Unix 时间戳、日期时间或 ISO 8601')
  return date
}

export function getTimestampValues(date: Date): TimestampValue[] {
  if (Number.isNaN(date.getTime())) throw new Error('无效的时间')
  const milliseconds = BigInt(date.getTime())
  return [
    { id: 'local', label: '本地时间', value: formatLocalDateTime(date) },
    { id: 'iso', label: 'ISO 8601', value: date.toISOString() },
    { id: 'utc', label: 'UTC / RFC 2822', value: date.toUTCString() },
    { id: 'timezone', label: '本地时区', value: formatTimeZone(date) },
    { id: 'seconds', label: '秒级 Unix', value: floorDiv(milliseconds, 1000n).toString() },
    { id: 'milliseconds', label: '毫秒级 Unix', value: milliseconds.toString() },
    { id: 'microseconds', label: '微秒级 Unix', value: (milliseconds * 1000n).toString() },
  ]
}

export function formatTimestampInput(date: Date): string {
  return formatLocalDateTime(date)
}

export function adjustTimestamp(date: Date, amount: number, unit: TimestampUnit): Date {
  if (Number.isNaN(date.getTime())) throw new Error('无效的基准时间')
  if (!Number.isFinite(amount)) throw new Error('时间运算数值必须是有限数字')
  const adjusted = new Date(date.getTime() + amount * UNIT_MILLISECONDS[unit])
  if (Number.isNaN(adjusted.getTime())) throw new Error('时间运算结果超出可用范围')
  return adjusted
}

function parseNumericTimestamp(value: string): Date {
  const digits = value.startsWith('-') ? value.length - 1 : value.length
  if (digits > 16) throw new Error('Unix 时间戳最多支持 16 位微秒')
  const numeric = BigInt(value)
  let milliseconds: bigint
  if (digits <= 10) milliseconds = numeric * 1000n
  else if (digits <= 13) milliseconds = numeric
  else if (digits <= 16) milliseconds = numeric / 1000n
  else milliseconds = numeric / 1000n
  const date = new Date(Number(milliseconds))
  if (Number.isNaN(date.getTime())) throw new Error('Unix 时间戳超出可转换范围')
  return date
}

function formatLocalDateTime(date: Date): string {
  const pad = (number: number, length = 2) => String(number).padStart(length, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

function formatTimeZone(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0')
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return `GMT${sign}${hours}:${minutes}${zone ? ` · ${zone}` : ''}`
}

function floorDiv(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor
  return value < 0n && value % divisor !== 0n ? quotient - 1n : quotient
}
