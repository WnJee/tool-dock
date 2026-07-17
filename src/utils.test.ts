import { describe, expect, it } from 'vitest'
import { decodeBase58, decodeBase64, encodeBase58, encodeBase64, formatJson, formatTimestamp, minifyJson } from './utils'

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

describe('timestamp transforms', () => {
  it('includes aligned labels and CTS output', () => {
    const result = formatTimestamp('1721203200')
    expect(result).toContain('本地时间\t')
    expect(result).toContain('ISO 时间\t2024-07-17T08:00:00.000Z')
    expect(result).toMatch(/CTS 时间\t\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} GMT[+-]\d{2}:\d{2}/)
    expect(result).toContain('秒级时间戳\t1721203200')
    expect(result).toContain('毫秒时间戳\t1721203200000')
  })
})
