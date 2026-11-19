import { dump as dumpYaml, load as loadYaml } from 'js-yaml'
import { formatJson, minifyJson } from './utils'

export type FormatterLanguage = 'json' | 'xml' | 'html' | 'javascript' | 'yaml-properties'
export type FormatterMode = 'format' | 'minify' | 'escape' | 'unescape' | 'yaml-to-properties' | 'properties-to-yaml'

export interface FormatterDefinition {
  id: FormatterLanguage
  name: string
  description: string
  modes: Array<[FormatterMode, string]>
  placeholder: string
}

export const FORMATTERS: FormatterDefinition[] = [
  {
    id: 'json',
    name: 'JSON',
    description: '格式化、压缩、转义与反转义',
    modes: [
      ['format', '格式化'],
      ['minify', '压缩'],
      ['escape', '转义'],
      ['unescape', '反转义'],
    ],
    placeholder: '{"name":"ToolDock","ready":true}',
  },
  {
    id: 'xml',
    name: 'XML',
    description: '语法校验、缩进与压缩',
    modes: [
      ['format', '格式化'],
      ['minify', '压缩'],
    ],
    placeholder: '<root><item id="1">内容</item></root>',
  },
  { id: 'html', name: 'HTML', description: '按 HTML 语法智能排版', modes: [['format', '格式化']], placeholder: '<main><h1>ToolDock</h1><p>Hello</p></main>' },
  {
    id: 'javascript',
    name: 'JavaScript',
    description: '按 JavaScript 语法智能排版',
    modes: [['format', '格式化']],
    placeholder: 'const greet=(name)=>{console.log(`Hello ${name}`)}',
  },
  {
    id: 'yaml-properties',
    name: 'YAML / Properties',
    description: '嵌套 YAML 与点号路径 Properties 互转',
    modes: [
      ['yaml-to-properties', 'YAML → Properties'],
      ['properties-to-yaml', 'Properties → YAML'],
    ],
    placeholder: 'server:\n  port: 8080\n  enabled: true',
  },
]

export async function transformFormat(language: FormatterLanguage, input: string, mode: FormatterMode): Promise<string> {
  if (language === 'json') {
    if (mode === 'minify') return minifyJson(input)
    if (mode === 'escape') return escapeJson(input)
    if (mode === 'unescape') return unescapeJson(input)
    return formatJson(input)
  }
  if (language === 'xml') return formatXml(input, mode === 'minify')
  if (language === 'html') return formatHtml(input)
  if (language === 'javascript') return formatJavaScript(input)
  return mode === 'properties-to-yaml' ? propertiesToYaml(input) : yamlToProperties(input)
}

async function formatHtml(value: string): Promise<string> {
  const [{ format }, { default: htmlPlugin }] = await Promise.all([import('prettier/standalone'), import('prettier/plugins/html')])
  return format(value, { parser: 'html', plugins: [htmlPlugin], tabWidth: 2, printWidth: 100 })
}

async function formatJavaScript(value: string): Promise<string> {
  const [{ format }, { default: babelPlugin }, { default: estreePlugin }] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/babel'),
    import('prettier/plugins/estree'),
  ])
  return format(value, { parser: 'babel', plugins: [babelPlugin, estreePlugin], tabWidth: 2, printWidth: 100, semi: false, singleQuote: true })
}

export function escapeJson(value: string): string {
  return JSON.stringify(value).slice(1, -1)
}

export function unescapeJson(value: string): string {
  try {
    const normalized = value.trim()
    const result = JSON.parse(normalized.startsWith('"') ? normalized : `"${normalized}"`)
    if (typeof result !== 'string') throw new Error()
    return result
  } catch {
    throw new Error('无效的 JSON 转义文本')
  }
}

export function yamlToProperties(value: string): string {
  const parsed = loadYaml(value)
  if (parsed === undefined) return ''
  if (!isContainer(parsed)) throw new Error('YAML 根节点必须是对象或数组')
  const lines: string[] = []
  flattenYaml(parsed, '', lines, new WeakSet())
  return lines.join('\n')
}

export function propertiesToYaml(value: string): string {
  const root: Record<string, unknown> = {}
  for (const line of joinPropertyLines(value)) {
    const trimmed = line.trimStart()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue
    const [rawKey, rawValue] = splitProperty(line)
    const key = unescapeProperty(rawKey.trim())
    if (!key) continue
    setPath(root, parsePropertyPath(key), parsePropertyScalar(unescapeProperty(rawValue.trimStart())))
  }
  return dumpYaml(root, { indent: 2, lineWidth: 100, noRefs: true, sortKeys: false })
}

function formatXml(value: string, minify: boolean): string {
  const parser = new DOMParser()
  const document = parser.parseFromString(value, 'application/xml')
  const error = document.querySelector('parsererror')
  if (error) throw new Error(`XML 语法错误：${error.textContent?.split('\n')[0] ?? '无法解析'}`)
  return [...document.childNodes]
    .map((node) => serializeXmlNode(node, 0, minify))
    .filter(Boolean)
    .join(minify ? '' : '\n')
}

function serializeXmlNode(node: Node, depth: number, minify: boolean): string {
  const serializer = new XMLSerializer()
  if (node.nodeType !== Node.ELEMENT_NODE) return serializer.serializeToString(node).trim()
  const element = node as Element
  const children = [...element.childNodes].filter((child) => child.nodeType !== Node.TEXT_NODE || child.textContent?.trim())
  const hasMixedContent = children.some((child) => child.nodeType === Node.TEXT_NODE) && children.some((child) => child.nodeType === Node.ELEMENT_NODE)
  if (hasMixedContent) return `${minify ? '' : '  '.repeat(depth)}${serializer.serializeToString(element)}`
  const indent = minify ? '' : '  '.repeat(depth)
  const attributes = [...element.attributes].map((attribute) => ` ${attribute.name}="${escapeXmlAttribute(attribute.value)}"`).join('')
  if (children.length === 0) return `${indent}<${element.tagName}${attributes}/>`
  if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE)
    return `${indent}<${element.tagName}${attributes}>${serializer.serializeToString(children[0])}</${element.tagName}>`
  const separator = minify ? '' : '\n'
  const body = children.map((child) => serializeXmlNode(child, depth + 1, minify)).join(separator)
  return `${indent}<${element.tagName}${attributes}>${separator}${body}${separator}${indent}</${element.tagName}>`
}

function escapeXmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function flattenYaml(value: unknown, path: string, lines: string[], seen: WeakSet<object>): void {
  if (!isContainer(value)) {
    lines.push(`${escapeProperty(path, true)}=${escapeProperty(formatPropertyScalar(value), false)}`)
    return
  }
  if (seen.has(value)) throw new Error('YAML 中包含循环引用，Properties 无法表示')
  seen.add(value)
  const entries = Array.isArray(value) ? value.map((item, index) => [`[${index}]`, item] as const) : Object.entries(value)
  if (entries.length === 0 && path) lines.push(`${escapeProperty(path, true)}=${Array.isArray(value) ? '[]' : '{}'}`)
  for (const [key, item] of entries) {
    const nextPath = Array.isArray(value) ? `${path}${key}` : path ? `${path}.${key}` : key
    flattenYaml(item, nextPath, lines, seen)
  }
  seen.delete(value)
}

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === 'object' && !(value instanceof Date)
}

function formatPropertyScalar(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function joinPropertyLines(value: string): string[] {
  const output: string[] = []
  let current = ''
  for (const line of value.split(/\r?\n/)) {
    current += current ? line.trimStart() : line
    const trailingSlashes = current.match(/\\+$/)?.[0].length ?? 0
    if (trailingSlashes % 2 === 1) current = current.slice(0, -1)
    else {
      output.push(current)
      current = ''
    }
  }
  if (current) output.push(current)
  return output
}

function splitProperty(line: string): [string, string] {
  let escaped = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (!escaped && (char === '=' || char === ':' || /\s/.test(char))) {
      let valueStart = index + 1
      while (/\s/.test(line[valueStart] ?? '')) valueStart += 1
      if (line[valueStart] === '=' || line[valueStart] === ':') valueStart += 1
      while (/\s/.test(line[valueStart] ?? '')) valueStart += 1
      return [line.slice(0, index), line.slice(valueStart)]
    }
    escaped = !escaped && char === '\\'
    if (char !== '\\') escaped = false
  }
  return [line, '']
}

function unescapeProperty(value: string): string {
  return value.replace(/\\u([0-9a-fA-F]{4})|\\(.)/g, (_, hex: string | undefined, escaped: string | undefined) => {
    if (hex) return String.fromCharCode(Number.parseInt(hex, 16))
    return ({ t: '\t', n: '\n', r: '\r', f: '\f' } as Record<string, string>)[escaped ?? ''] ?? escaped ?? ''
  })
}

function escapeProperty(value: string, key: boolean): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(key ? /([ :=#!])/g : /^([ #!])/g, '\\$1')
}

function parsePropertyPath(path: string): Array<string | number> {
  const tokens: Array<string | number> = []
  path.replace(/([^.\[\]]+)|\[(\d+)\]/g, (_, name: string | undefined, index: string | undefined) => {
    tokens.push(index === undefined ? name! : Number(index))
    return ''
  })
  return tokens
}

function setPath(root: Record<string, unknown>, tokens: Array<string | number>, value: unknown): void {
  if (tokens.length === 0 || typeof tokens[0] === 'number') throw new Error('Properties 键必须以名称开头')
  let current: Record<string | number, unknown> = root
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const token = tokens[index]!
    const next = tokens[index + 1]
    const container: Record<string, unknown> | unknown[] = typeof next === 'number' ? [] : {}
    if (current[token] === undefined || !isContainer(current[token])) current[token] = container
    current = current[token] as Record<string | number, unknown>
  }
  current[tokens[tokens.length - 1]!] = value
}

function parsePropertyScalar(value: string): unknown {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) return Number(value)
  return value
}
