export type TextCase = 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab'
export type TextSortOrder = 'none' | 'asc' | 'desc' | 'length-asc' | 'length-desc'
export type TextFilterMode = 'none' | 'keep' | 'remove'
export type TextFilterKind = 'contains' | 'regex'

export interface TextOptions {
  trimLines: boolean
  removeEmpty: boolean
  dedupe: boolean
  sort: TextSortOrder
  reverse: boolean
  numberLines: boolean
  numberStart: number
  prefix: string
  suffix: string
  textCase: TextCase | 'none'
  filterMode: TextFilterMode
  filterKind: TextFilterKind
  filterValue: string
  joinSeparator: string
  arrayLiteral: boolean
}

export interface TextStats {
  chars: number
  charsNoSpace: number
  words: number
  lines: number
  nonEmptyLines: number
  cjk: number
  bytes: number
}

export const DEFAULT_TEXT_OPTIONS: TextOptions = {
  trimLines: true,
  removeEmpty: true,
  dedupe: false,
  sort: 'none',
  reverse: false,
  numberLines: false,
  numberStart: 1,
  prefix: '',
  suffix: '',
  textCase: 'none',
  filterMode: 'none',
  filterKind: 'contains',
  filterValue: '',
  joinSeparator: '',
  arrayLiteral: false,
}

export const TEXT_CASES: ReadonlyArray<readonly [TextCase, string]> = [
  ['upper', '大写'],
  ['lower', '小写'],
  ['title', '首字母大写'],
  ['camel', '驼峰'],
  ['snake', '下划线'],
  ['kebab', '短横线'],
]

const COLLATOR = new Intl.Collator(['zh-Hans-CN', 'en'], { numeric: true, sensitivity: 'base' })
const WORD_PATTERN = /[^\p{L}\p{N}]+/u

export function normalizeText(text: string): string {
  return text.replace(/\r\n?/g, '\n')
}

export function splitLines(text: string): string[] {
  const normalized = normalizeText(text)
  return normalized ? normalized.split('\n') : []
}

export function toWords(value: string): string[] {
  return value.split(WORD_PATTERN).filter(Boolean)
}

export function convertCase(value: string, mode: TextCase): string {
  if (mode === 'upper') return value.toUpperCase()
  if (mode === 'lower') return value.toLowerCase()
  if (mode === 'title') return value.replace(/(^|[\s\-_.])(\p{L})/gu, (_, separator: string, char: string) => `${separator}${char.toUpperCase()}`)
  const words = toWords(value).map((word) => word.toLowerCase())
  if (!words.length) return value
  if (mode === 'snake') return words.join('_')
  if (mode === 'kebab') return words.join('-')
  return words.map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))).join('')
}

/** joinSeparator 支持用户输入 \n、\t、\r 这类转义写法 */
function resolveSeparator(separator: string): string {
  return separator.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r')
}

function createMatcher(kind: TextFilterKind, value: string): (line: string) => boolean {
  if (kind === 'regex') {
    let pattern: RegExp
    try {
      pattern = new RegExp(value, 'i')
    } catch {
      throw new Error(`正则表达式无效：${value}`)
    }
    return (line) => pattern.test(line)
  }
  const needle = value.toLowerCase()
  return (line) => line.toLowerCase().includes(needle)
}

function sortLines(lines: string[], order: Exclude<TextSortOrder, 'none'>): string[] {
  const sorted = [...lines]
  if (order === 'length-asc') return sorted.sort((a, b) => a.length - b.length || COLLATOR.compare(a, b))
  if (order === 'length-desc') return sorted.sort((a, b) => b.length - a.length || COLLATOR.compare(a, b))
  sorted.sort(COLLATOR.compare)
  return order === 'desc' ? sorted.reverse() : sorted
}

/**
 * 固定顺序的文本流水线，保证相同输入与选项永远得到相同输出：
 * 裁剪 → 过滤 → 空行 → 大小写 → 去重 → 排序 → 反转 → 行号 → 前后缀 → 输出。
 * 大小写在去重之前，避免大小写转换后重新出现重复行。
 */
export function applyTextPipeline(text: string, options: Partial<TextOptions> = {}): string {
  const config: TextOptions = { ...DEFAULT_TEXT_OPTIONS, ...options }
  if (!text) return ''

  let lines = splitLines(text)
  if (config.trimLines) lines = lines.map((line) => line.trim())

  if (config.filterMode !== 'none' && config.filterValue) {
    const match = createMatcher(config.filterKind, config.filterValue)
    lines = lines.filter((line) => (config.filterMode === 'keep' ? match(line) : !match(line)))
  }
  if (config.removeEmpty) lines = lines.filter((line) => line.trim() !== '')
  if (config.textCase !== 'none') {
    const textCase = config.textCase
    lines = lines.map((line) => convertCase(line, textCase))
  }
  if (config.dedupe) {
    const seen = new Set<string>()
    lines = lines.filter((line) => {
      if (seen.has(line)) return false
      seen.add(line)
      return true
    })
  }
  if (config.sort !== 'none') lines = sortLines(lines, config.sort)
  if (config.reverse) lines.reverse()

  if (config.numberLines) {
    const start = Number.isFinite(config.numberStart) ? Math.trunc(config.numberStart) : 1
    const width = String(start + lines.length - 1).length
    lines = lines.map((line, index) => `${String(start + index).padStart(width, ' ')}. ${line}`)
  }
  if (config.prefix || config.suffix) lines = lines.map((line) => `${config.prefix}${line}${config.suffix}`)

  if (config.arrayLiteral) return `[\n${lines.map((line) => `  ${JSON.stringify(line)},`).join('\n')}\n]`
  if (config.joinSeparator) return lines.join(resolveSeparator(config.joinSeparator))
  return lines.join('\n')
}

export function getTextStats(text: string): TextStats {
  const lines = splitLines(text)
  const chars = Array.from(text)
  return {
    chars: chars.length,
    charsNoSpace: chars.filter((char) => !/\s/.test(char)).length,
    words: text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0,
    lines: lines.length,
    nonEmptyLines: lines.filter((line) => line.trim() !== '').length,
    cjk: text.match(/[\u3400-\u4dbf\u4e00-\u9fff]/g)?.length ?? 0,
    bytes: new TextEncoder().encode(text).length,
  }
}
