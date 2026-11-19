import { describe, expect, it } from 'vitest'
import { decodeBase32, decodeBase64Url, decodeHex, encodeBase32, encodeBase64Url, encodeHex, generateRandomPassword256, md5, transformCrypto } from './crypto'

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

  it('matches Base64URL vectors and round-trips unicode without padding', () => {
    expect(encodeBase64Url('hello?')).toBe('aGVsbG8_')
    const source = '中文 Base64URL 👋'
    const encoded = encodeBase64Url(source)
    expect(encoded).not.toMatch(/[+/=]/)
    expect(decodeBase64Url(encoded)).toBe(source)
    expect(() => decodeBase64Url('a')).toThrow('无效的 Base64URL 内容')
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

  it('generates a 256-bit hexadecimal password', () => {
    const password = generateRandomPassword256()
    expect(password).toMatch(/^[0-9a-f]{64}$/)
    expect(password.length / 2).toBe(32)
  })

  it.each([
    ['chacha20', 'CHACHA20.v1.', 'ChaCha20 解密失败'],
    ['sm4', 'SM4CBC.v1.', 'SM4 解密失败'],
  ] as const)('round-trips %s and rejects a wrong password', async (algorithm, prefix, error) => {
    const encrypted = await transformCrypto(algorithm, '你好，密码学 🔐', 'encrypt', 'correct horse battery staple')
    expect(encrypted).toMatch(new RegExp(`^${prefix.replace(/\./g, '\\.')}`))
    await expect(transformCrypto(algorithm, encrypted, 'decrypt', 'correct horse battery staple')).resolves.toBe('你好，密码学 🔐')
    await expect(transformCrypto(algorithm, encrypted, 'decrypt', 'wrong password')).rejects.toThrow(error)
  })
})
