import { describe, expect, it } from 'vitest'
import { adjustTimestamp, formatTimestampInput, getTimestampValues, parseTimestampInput } from './timestamp-utils'

describe('timestamp input parsing', () => {
  it('recognizes seconds, milliseconds and microseconds', () => {
    const expected = '2024-07-17T08:00:00.000Z'
    expect(parseTimestampInput('1721203200').toISOString()).toBe(expected)
    expect(parseTimestampInput('1721203200000').toISOString()).toBe(expected)
    expect(parseTimestampInput('1721203200000000').toISOString()).toBe(expected)
  })

  it('recognizes ISO and local date-time inputs', () => {
    expect(parseTimestampInput('2024-07-17T08:00:00.000Z').toISOString()).toBe('2024-07-17T08:00:00.000Z')
    const local = parseTimestampInput('2026-07-31 16:20:30.125')
    expect(formatTimestampInput(local)).toBe('2026-07-31 16:20:30.125')
  })

  it('rejects invalid calendar values and oversized timestamps', () => {
    expect(() => parseTimestampInput('2026-02-30 12:00:00')).toThrow('超出有效范围')
    expect(() => parseTimestampInput('1721203200000000000')).toThrow('最多支持 16 位')
  })
})

describe('timestamp output formats', () => {
  it('returns all common representations', () => {
    const values = Object.fromEntries(getTimestampValues(new Date('2024-07-17T08:00:00.123Z')).map((item) => [item.id, item.value]))
    expect(values.iso).toBe('2024-07-17T08:00:00.123Z')
    expect(values.seconds).toBe('1721203200')
    expect(values.milliseconds).toBe('1721203200123')
    expect(values.microseconds).toBe('1721203200123000')
  })
})

describe('timestamp arithmetic', () => {
  it('adds all supported duration units', () => {
    const base = new Date('2024-07-17T08:00:00.000Z')
    expect(adjustTimestamp(base, 1, 'days').toISOString()).toBe('2024-07-18T08:00:00.000Z')
    expect(adjustTimestamp(base, 2, 'hours').toISOString()).toBe('2024-07-17T10:00:00.000Z')
    expect(adjustTimestamp(base, 30, 'minutes').toISOString()).toBe('2024-07-17T08:30:00.000Z')
    expect(adjustTimestamp(base, 45, 'seconds').toISOString()).toBe('2024-07-17T08:00:45.000Z')
  })

  it('supports subtraction and fractional values', () => {
    const base = new Date('2024-07-17T08:00:00.000Z')
    expect(adjustTimestamp(base, -1.5, 'hours').toISOString()).toBe('2024-07-17T06:30:00.000Z')
  })
})
