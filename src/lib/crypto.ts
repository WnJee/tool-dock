import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import sm4 from 'sm-crypto/src/sm4/index.js'
import { decodeBase58, decodeBase64, encodeBase58, encodeBase64 } from './utils'

export type CryptoAlgorithm = 'base64' | 'base58' | 'base32' | 'hex' | 'url' | 'base64url' | 'md5' | 'sha1' | 'sha256' | 'sha512' | 'aes' | 'chacha20' | 'sm4'
export type CryptoMode = 'encode' | 'decode' | 'hash' | 'encrypt' | 'decrypt'
export type CryptoGroup = '编码 / 解码' | '哈希摘要' | '对称加密'

export interface CryptoAlgorithmDefinition {
  id: CryptoAlgorithm
  name: string
  group: CryptoGroup
  description: string
  modes: Array<[CryptoMode, string]>
}

export const CRYPTO_GROUPS: CryptoGroup[] = ['编码 / 解码', '哈希摘要', '对称加密']

export const CRYPTO_ALGORITHMS: CryptoAlgorithmDefinition[] = [
  {
    id: 'base64',
    name: 'Base64',
    group: '编码 / 解码',
    description: 'Unicode 安全的通用文本编码',
    modes: [
      ['encode', '编码'],
      ['decode', '解码'],
    ],
  },
  {
    id: 'base58',
    name: 'Base58',
    group: '编码 / 解码',
    description: '移除易混淆字符，常用于短标识',
    modes: [
      ['encode', '编码'],
      ['decode', '解码'],
    ],
  },
  {
    id: 'base32',
    name: 'Base32',
    group: '编码 / 解码',
    description: '仅使用大写字母和 2-7 的编码',
    modes: [
      ['encode', '编码'],
      ['decode', '解码'],
    ],
  },
  {
    id: 'hex',
    name: 'Hex',
    group: '编码 / 解码',
    description: '文本与十六进制字节互转',
    modes: [
      ['encode', '编码'],
      ['decode', '解码'],
    ],
  },
  {
    id: 'url',
    name: 'URL',
    group: '编码 / 解码',
    description: '查询参数与特殊字符编解码',
    modes: [
      ['encode', '编码'],
      ['decode', '解码'],
    ],
  },
  {
    id: 'base64url',
    name: 'Base64URL',
    group: '编码 / 解码',
    description: '适用于 URL 和文件名的 Base64 变体',
    modes: [
      ['encode', '编码'],
      ['decode', '解码'],
    ],
  },
  { id: 'md5', name: 'MD5', group: '哈希摘要', description: '兼容性摘要，不适合密码保护', modes: [['hash', '生成摘要']] },
  { id: 'sha1', name: 'SHA-1', group: '哈希摘要', description: '旧式 160 位摘要，不建议用于安全场景', modes: [['hash', '生成摘要']] },
  { id: 'sha256', name: 'SHA-256', group: '哈希摘要', description: '常用的 256 位安全摘要', modes: [['hash', '生成摘要']] },
  { id: 'sha512', name: 'SHA-512', group: '哈希摘要', description: '512 位安全摘要', modes: [['hash', '生成摘要']] },
  {
    id: 'aes',
    name: 'AES-GCM',
    group: '对称加密',
    description: '带完整性校验的 AES-256 加密',
    modes: [
      ['encrypt', '加密'],
      ['decrypt', '解密'],
    ],
  },
  {
    id: 'chacha20',
    name: 'ChaCha20',
    group: '对称加密',
    description: 'ChaCha20-Poly1305 认证加密',
    modes: [
      ['encrypt', '加密'],
      ['decrypt', '解密'],
    ],
  },
  {
    id: 'sm4',
    name: 'SM4',
    group: '对称加密',
    description: 'SM4-CBC 与 HMAC-SHA256 完整性校验',
    modes: [
      ['encrypt', '加密'],
      ['decrypt', '解密'],
    ],
  },
]

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export async function transformCrypto(algorithm: CryptoAlgorithm, input: string, mode: CryptoMode, password = ''): Promise<string> {
  if (algorithm === 'base64') return mode === 'encode' ? encodeBase64(input) : decodeBase64(input)
  if (algorithm === 'base58') return mode === 'encode' ? encodeBase58(input) : decodeBase58(input)
  if (algorithm === 'base32') return mode === 'encode' ? encodeBase32(input) : decodeBase32(input)
  if (algorithm === 'hex') return mode === 'encode' ? encodeHex(input) : decodeHex(input)
  if (algorithm === 'url') return mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input)
  if (algorithm === 'base64url') return mode === 'encode' ? encodeBase64Url(input) : decodeBase64Url(input)
  if (algorithm === 'md5') return md5(input)
  if (algorithm === 'sha1') return digest(input, 'SHA-1')
  if (algorithm === 'sha256') return digest(input, 'SHA-256')
  if (algorithm === 'sha512') return digest(input, 'SHA-512')
  if (!password) throw new Error('请输入加密密码')
  if (algorithm === 'aes') return mode === 'encrypt' ? encryptAes(input, password) : decryptAes(input, password)
  if (algorithm === 'chacha20') return mode === 'encrypt' ? encryptChaCha20(input, password) : decryptChaCha20(input, password)
  return mode === 'encrypt' ? encryptSm4(input, password) : decryptSm4(input, password)
}

export function generateRandomPassword256(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return bytesToHex(bytes)
}

export function encodeBase64Url(value: string): string {
  return encodeBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeBase64Url(value: string): string {
  const normalized = value.trim().replace(/\s/g, '').replace(/=+$/, '')
  if (!/^[A-Za-z0-9_-]*$/.test(normalized) || normalized.length % 4 === 1) throw new Error('无效的 Base64URL 内容')
  const base64 = normalized
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  try {
    return decodeBase64(base64)
  } catch {
    throw new Error('Base64URL 解码失败，请检查输入')
  }
}

export function encodeBase32(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let bits = 0
  let buffer = 0
  let result = ''
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) result += BASE32_ALPHABET[(buffer << (5 - bits)) & 31]
  return result.padEnd(Math.ceil(result.length / 8) * 8, '=')
}

export function decodeBase32(value: string): string {
  const normalized = value.trim().replace(/\s|=/g, '').toUpperCase()
  let bits = 0
  let buffer = 0
  const bytes: number[] = []
  for (const char of normalized) {
    const digit = BASE32_ALPHABET.indexOf(char)
    if (digit < 0) throw new Error(`无效的 Base32 字符：${char}`)
    buffer = (buffer << 5) | digit
    bits += 5
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return decodeUtf8(new Uint8Array(bytes), 'Base32')
}

export function encodeHex(value: string): string {
  return bytesToHex(new TextEncoder().encode(value))
}

export function decodeHex(value: string): string {
  const normalized = value.trim().replace(/\s/g, '')
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(normalized)) throw new Error('Hex 内容必须由完整的十六进制字节组成')
  const bytes = Uint8Array.from(normalized.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16))
  return decodeUtf8(bytes, 'Hex')
}

export function md5(value: string): string {
  const input = new TextEncoder().encode(value)
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64
  const bytes = new Uint8Array(paddedLength)
  bytes.set(input)
  bytes[input.length] = 0x80
  const view = new DataView(bytes.buffer)
  const bitLength = input.length * 8
  view.setUint32(paddedLength - 8, bitLength >>> 0, true)
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476
  const shifts = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21]
  const constants = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0)

  for (let offset = 0; offset < bytes.length; offset += 64) {
    let a = a0
    let b = b0
    let c = c0
    let d = d0
    for (let index = 0; index < 64; index += 1) {
      let f: number
      let word: number
      if (index < 16) {
        f = (b & c) | (~b & d)
        word = index
      } else if (index < 32) {
        f = (d & b) | (~d & c)
        word = (5 * index + 1) % 16
      } else if (index < 48) {
        f = b ^ c ^ d
        word = (3 * index + 5) % 16
      } else {
        f = c ^ (b | ~d)
        word = (7 * index) % 16
      }
      const sum = (a + f + constants[index] + view.getUint32(offset + word * 4, true)) >>> 0
      const shift = shifts[Math.floor(index / 16) * 4 + (index % 4)]
      const rotated = ((sum << shift) | (sum >>> (32 - shift))) >>> 0
      ;[a, b, c, d] = [d, (b + rotated) >>> 0, b, c]
    }
    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }
  const output = new Uint8Array(16)
  const outputView = new DataView(output.buffer)
  ;[a0, b0, c0, d0].forEach((word, index) => outputView.setUint32(index * 4, word, true))
  return bytesToHex(output)
}

async function digest(value: string, algorithm: AlgorithmIdentifier): Promise<string> {
  const result = await crypto.subtle.digest(algorithm, new TextEncoder().encode(value))
  return bytesToHex(new Uint8Array(result))
}

async function encryptAes(value: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(password, salt, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value))
  return `AESGCM.v1.${bytesToBase64(salt)}.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`
}

async function decryptAes(value: string, password: string): Promise<string> {
  const [header, version, saltValue, ivValue, encryptedValue] = value.trim().split('.')
  if (header !== 'AESGCM' || version !== 'v1' || !saltValue || !ivValue || !encryptedValue) throw new Error('无效的 AES-GCM 密文格式')
  try {
    const salt = base64ToBytes(saltValue)
    const iv = base64ToBytes(ivValue)
    const key = await deriveAesKey(password, salt, ['decrypt'])
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBytes(encryptedValue))
    return decodeUtf8(new Uint8Array(decrypted), 'AES')
  } catch {
    throw new Error('AES 解密失败，请检查密码或密文')
  }
}

async function deriveAesKey(password: string, salt: Uint8Array<ArrayBuffer>, usages: KeyUsage[]): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, usages)
}

async function encryptChaCha20(value: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKeyBytes(password, salt, 256)
  const encrypted = chacha20poly1305(key, nonce).encrypt(new TextEncoder().encode(value))
  return `CHACHA20.v1.${bytesToBase64(salt)}.${bytesToBase64(nonce)}.${bytesToBase64(encrypted)}`
}

async function decryptChaCha20(value: string, password: string): Promise<string> {
  const [header, version, saltValue, nonceValue, encryptedValue] = value.trim().split('.')
  if (header !== 'CHACHA20' || version !== 'v1' || !saltValue || !nonceValue || !encryptedValue) throw new Error('无效的 ChaCha20 密文格式')
  try {
    const salt = base64ToBytes(saltValue)
    const nonce = base64ToBytes(nonceValue)
    if (salt.length !== 16 || nonce.length !== 12) throw new Error('invalid parameters')
    const key = await deriveKeyBytes(password, salt, 256)
    const decrypted = chacha20poly1305(key, nonce).decrypt(base64ToBytes(encryptedValue))
    return decodeUtf8(decrypted, 'ChaCha20')
  } catch {
    throw new Error('ChaCha20 解密失败，请检查密码或密文')
  }
}

async function encryptSm4(value: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await deriveKeyBytes(password, salt, 384)
  const encryptionKey = keyMaterial.slice(0, 16)
  const authenticationKey = keyMaterial.slice(16)
  const encrypted = new Uint8Array(sm4.encrypt([...new TextEncoder().encode(value)], [...encryptionKey], { mode: 'cbc', iv: [...iv], output: 'array' }))
  const tag = await signHmac(authenticationKey, joinBytes(salt, iv, encrypted))
  return `SM4CBC.v1.${bytesToBase64(salt)}.${bytesToBase64(iv)}.${bytesToBase64(encrypted)}.${bytesToBase64(tag)}`
}

async function decryptSm4(value: string, password: string): Promise<string> {
  const [header, version, saltValue, ivValue, encryptedValue, tagValue] = value.trim().split('.')
  if (header !== 'SM4CBC' || version !== 'v1' || !saltValue || !ivValue || !encryptedValue || !tagValue) throw new Error('无效的 SM4 密文格式')
  try {
    const salt = base64ToBytes(saltValue)
    const iv = base64ToBytes(ivValue)
    const encrypted = base64ToBytes(encryptedValue)
    const tag = base64ToBytes(tagValue)
    if (salt.length !== 16 || iv.length !== 16 || encrypted.length === 0 || encrypted.length % 16 !== 0) throw new Error('invalid parameters')
    const keyMaterial = await deriveKeyBytes(password, salt, 384)
    const encryptionKey = keyMaterial.slice(0, 16)
    const authenticationKey = keyMaterial.slice(16)
    if (!(await verifyHmac(authenticationKey, joinBytes(salt, iv, encrypted), tag))) throw new Error('invalid tag')
    const decrypted = new Uint8Array(sm4.decrypt([...encrypted], [...encryptionKey], { mode: 'cbc', iv: [...iv], output: 'array' }))
    return decodeUtf8(decrypted, 'SM4')
  } catch {
    throw new Error('SM4 解密失败，请检查密码或密文')
  }
}

async function deriveKeyBytes(password: string, salt: Uint8Array<ArrayBuffer>, length: number): Promise<Uint8Array<ArrayBuffer>> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, material, length)
  return new Uint8Array(bits)
}

async function signHmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, data))
}

async function verifyHmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>, signature: Uint8Array<ArrayBuffer>): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  return crypto.subtle.verify('HMAC', cryptoKey, signature, data)
}

function joinBytes(...values: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(values.reduce((total, value) => total + value.length, 0))
  let offset = 0
  values.forEach((value) => {
    result.set(value, offset)
    offset += value.length
  })
  return result
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function decodeUtf8(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error(`${label} 解码结果不是有效的 UTF-8 文本`)
  }
}
