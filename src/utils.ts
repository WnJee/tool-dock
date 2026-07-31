const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE58_MAP = new Map([...BASE58_ALPHABET].map((char, index) => [char, index]))

export function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

export function decodeBase64(value: string): string {
  const normalized = value.trim().replace(/\s/g, '')
  const binary = atob(normalized)
  return new TextDecoder('utf-8', { fatal: true }).decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  )
}

export function encodeBase58(value: string): string {
  const bytes = new TextEncoder().encode(value)
  if (bytes.length === 0) return ''
  let number = 0n
  for (const byte of bytes) number = number * 256n + BigInt(byte)
  let encoded = ''
  while (number > 0n) {
    encoded = BASE58_ALPHABET[Number(number % 58n)] + encoded
    number /= 58n
  }
  for (const byte of bytes) {
    if (byte !== 0) break
    encoded = '1' + encoded
  }
  return encoded
}

export function decodeBase58(value: string): string {
  const normalized = value.trim()
  if (!normalized) return ''
  let number = 0n
  for (const char of normalized) {
    const digit = BASE58_MAP.get(char)
    if (digit === undefined) throw new Error(`无效的 Base58 字符：${char}`)
    number = number * 58n + BigInt(digit)
  }
  const decoded: number[] = []
  while (number > 0n) {
    decoded.unshift(Number(number % 256n))
    number /= 256n
  }
  for (const char of normalized) {
    if (char !== '1') break
    decoded.unshift(0)
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(decoded))
}

export function formatJson(value: string): string {
  return JSON.stringify(JSON.parse(value), null, 2)
}

export function minifyJson(value: string): string {
  return JSON.stringify(JSON.parse(value))
}
