import { describe, expect, it } from 'vitest'
import { createCustomSite, normalizeSiteUrl } from './site'

describe('custom site utilities', () => {
  it('normalizes site URLs and derives display data', () => {
    expect(normalizeSiteUrl('example.com/path')).toBe('https://example.com/path')
    expect(createCustomSite('custom-1', { name: ' 示例站 ', description: '', url: 'example.com', color: '#55caa3' })).toMatchObject({
      id: 'custom-1',
      name: '示例站',
      description: '自定义常用网站',
      url: 'https://example.com/',
      initials: '示例',
    })
  })
})
