import { describe, expect, it } from 'vitest'
import { decodeBase32, decodeHex, encodeBase32, encodeHex, md5, transformCrypto } from './crypto-utils'

describe('common encodings', () => {
  it('matches Base32 vectors and round-trips unicode', () => {
    expect(encodeBase32('foobar')).toBe('MZXW6YTBOI======')
    const source = '中文 Base32 👋'
    expect(decodeBase32(encodeBase32(source))).toBe(source)
  })

  it('round-trips unicode through hex', () => {
    const source = '你好，Hex'
    expect(decodeHex(encodeHex(source))).toBe(source)
  })
})

describe('hashes and encryption', () => {
  it('matches known MD5 vectors', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e')
    expect(md5('abc')).toBe('900150983cd24fb0d6963f7d28e17f72')
  })

  it('matches a known SHA-256 vector', async () => {
    await expect(transformCrypto('sha256', 'abc', 'hash')).resolves.toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('round-trips AES-GCM and rejects a wrong password', async () => {
    const encrypted = await transformCrypto('aes', '私密内容 🔐', 'encrypt', 'correct password')
    expect(encrypted).toMatch(/^AESGCM\.v1\./)
    await expect(transformCrypto('aes', encrypted, 'decrypt', 'correct password')).resolves.toBe('私密内容 🔐')
    await expect(transformCrypto('aes', encrypted, 'decrypt', 'wrong password')).rejects.toThrow('AES 解密失败')
  })
})
