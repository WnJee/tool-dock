import { describe, expect, it } from 'vitest'
import { applyTextPipeline, convertCase, getTextStats, splitLines, toWords } from './text'

describe('text pipeline', () => {
  it('trims, drops blank lines and dedupes in a stable order', () => {
    const input = '  b  \n\n a \n b\n a \n'
    expect(applyTextPipeline(input, { trimLines: true, removeEmpty: true, dedupe: true })).toBe('b\na')
  })

  it('sorts numerically for latin lines and by length for mixed content', () => {
    expect(applyTextPipeline('item10\nitem2\nitem1', { trimLines: true, sort: 'asc' })).toBe('item1\nitem2\nitem10')
    expect(applyTextPipeline('ccc\nb\n aa', { trimLines: true, sort: 'length-asc' })).toBe('b\naa\nccc')
    expect(applyTextPipeline('a\nb\nc', { trimLines: true, reverse: true })).toBe('c\nb\na')
  })

  it('applies padding-aware line numbers and affixes', () => {
    expect(applyTextPipeline('a\nb', { numberLines: true, numberStart: 9 })).toBe(' 9. a\n10. b')
    expect(applyTextPipeline('a\nb', { prefix: '- ', suffix: ';' })).toBe('- a;\n- b;')
  })

  it('filters by substring and regular expression', () => {
    expect(applyTextPipeline('alpha\nbeta\ngamma', { filterMode: 'keep', filterValue: 'a' })).toBe('alpha\nbeta\ngamma')
    expect(applyTextPipeline('alpha\nbeta', { filterMode: 'keep', filterKind: 'regex', filterValue: '^b' })).toBe('beta')
    expect(applyTextPipeline('alpha\nbeta', { filterMode: 'remove', filterKind: 'regex', filterValue: '^b' })).toBe('alpha')
    expect(() => applyTextPipeline('a', { filterMode: 'keep', filterKind: 'regex', filterValue: '[' })).toThrow('正则表达式无效')
  })

  it('supports joins, escaped separators and array literals', () => {
    expect(applyTextPipeline('a\nb', { joinSeparator: ', ' })).toBe('a, b')
    expect(applyTextPipeline('a\nb', { joinSeparator: '\\n' })).toBe('a\nb')
    expect(applyTextPipeline('a"b', { arrayLiteral: true })).toBe('[\n  "a\\"b",\n]')
  })

  it('dedupes after case conversion so case folding cannot reintroduce duplicates', () => {
    expect(applyTextPipeline('Apple\napple\nAPPLE', { textCase: 'lower', dedupe: true })).toBe('apple')
  })
})

describe('text case conversion', () => {
  it('handles words, CJK passthrough and separators', () => {
    expect(convertCase('hello world-foo', 'upper')).toBe('HELLO WORLD-FOO')
    expect(convertCase('hello world-foo', 'title')).toBe('Hello World-Foo')
    expect(convertCase('Hello world foo', 'camel')).toBe('helloWorldFoo')
    expect(convertCase('Hello world foo', 'snake')).toBe('hello_world_foo')
    expect(convertCase('Hello world foo', 'kebab')).toBe('hello-world-foo')
    expect(convertCase('中文 文本', 'upper')).toBe('中文 文本')
    expect(toWords('a_b-c.d')).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('text statistics', () => {
  it('counts characters, words, lines, CJK and UTF-8 bytes', () => {
    const stats = getTextStats('你好 world\n\n第二行')
    expect(stats.lines).toBe(3)
    expect(stats.nonEmptyLines).toBe(2)
    expect(stats.cjk).toBe(5)
    expect(stats.chars).toBe(13)
    expect(stats.bytes).toBe(new TextEncoder().encode('你好 world\n\n第二行').length)
    expect(splitLines('a\r\nb')).toEqual(['a', 'b'])
  })
})
