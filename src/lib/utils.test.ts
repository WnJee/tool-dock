import { describe, expect, it } from 'vitest'
import { decodeBase58, decodeBase64, encodeBase58, encodeBase64, formatJson, minifyJson } from './utils'

describe('text codecs', () => {
  it('round-trips unicode through Base64', () => {
    const source = '你好，ToolDock 👋'
    expect(decodeBase64(encodeBase64(source))).toBe(source)
  })

  it('matches known Base58 value and round-trips unicode', () => {
    expect(encodeBase58('Hello World')).toBe('JxF12TrwUP45BMd')
    const source = '中文 Base58'
    expect(decodeBase58(encodeBase58(source))).toBe(source)
  })

  it('rejects ambiguous Base58 characters', () => {
    expect(() => decodeBase58('0OIl')).toThrow('无效的 Base58 字符')
  })
})

describe('JSON transforms', () => {
  it('formats and minifies JSON', () => {
    expect(formatJson('{"ok":true,"items":[1,2]}')).toContain('\n  "ok": true')
    expect(minifyJson('{\n  "ok": true\n}')).toBe('{"ok":true}')
  })
})
