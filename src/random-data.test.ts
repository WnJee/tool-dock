import { describe, expect, it } from 'vitest'
import { generateChinaMobile, generateRandomData, generateUsTestPhone, PASSWORD_RULES } from './random-data'

describe('random profiles and contacts', () => {
  it('generates a complete China shipping profile', () => {
    const profile = Object.fromEntries(generateRandomData('china-profile').map((field) => [field.id, field.value]))
    expect(profile.name).toBeTruthy()
    expect(profile.phone).toMatch(/^1[3-9]\d{9}$/)
    expect(profile['postal-code']).toMatch(/^\d{6}$/)
    expect(profile.address).toMatch(/(?:省|市).+(?:路|大道)\d+号/)
  })

  it('generates a US billing profile with reserved test contacts', () => {
    const profile = Object.fromEntries(generateRandomData('us-profile').map((field) => [field.id, field.value]))
    expect(profile.phone).toMatch(/^\+1 \(\d{3}\) 555-01\d{2}$/)
    expect(profile.email).toMatch(/@example\.com$/)
    expect(profile.zip).toMatch(/^\d{5}$/)
    expect(profile.country).toBe('United States')
  })

  it('generates format-valid phone numbers', () => {
    expect(generateChinaMobile()).toMatch(/^1[3-9]\d{9}$/)
    expect(generateUsTestPhone('212')).toMatch(/^\+1 \(212\) 555-01\d{2}$/)
  })
})

describe('password rules', () => {
  it('generates passwords that satisfy every advertised regex', () => {
    for (const rule of PASSWORD_RULES) {
      for (let attempt = 0; attempt < 30; attempt += 1) expect(rule.generate(), rule.label).toMatch(rule.regex)
    }
  })

  it('returns every password preset with its pattern', () => {
    const passwords = generateRandomData('passwords')
    expect(passwords).toHaveLength(PASSWORD_RULES.length)
    expect(passwords.every((field) => field.value && field.detail)).toBe(true)
  })
})
