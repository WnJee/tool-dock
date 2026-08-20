export interface ProxyNode {
  id: string
  name: string
  url: string
  note: string
  enabled: boolean
}

export function normalizeNodeUrl(value: string) {
  const raw = value.trim()
  if (!raw) throw new Error('请输入节点地址')
  try {
    const parsed = new URL(raw)
    if (!['http:', 'https:', 'ss:', 'ssr:', 'vmess:', 'vless:', 'trojan:', 'hysteria:', 'hysteria2:', 'tuic:', 'socks5:'].includes(parsed.protocol)) throw new Error()
    return raw
  } catch {
    throw new Error('节点地址格式无效，请填写完整协议地址')
  }
}

export function decodeNodeInput(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const candidates = lines.flatMap((line) => {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(line)) return [line]
    try {
      const normalized = line.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
      const decoded = decodeURIComponent(escape(atob(padded)))
      return decoded.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    } catch {
      return []
    }
  })
  const urls = candidates.map((item) => normalizeNodeUrl(item))
  if (!urls.length) throw new Error('没有识别到有效的节点地址或 Base64 内容')
  return [...new Set(urls)]
}

export async function resolveNodeInput(value: string) {
  const resolved: string[] = []
  const visitedSubscriptions = new Set<string>()

  async function resolve(valueToResolve: string, depth: number) {
    if (depth > 3) throw new Error('订阅内容嵌套层级过深')
    const candidates = decodeNodeInput(valueToResolve)
    for (const candidate of candidates) {
      if (!/^https?:\/\//i.test(candidate)) {
        resolved.push(candidate)
        continue
      }
      if (visitedSubscriptions.has(candidate)) continue
      visitedSubscriptions.add(candidate)
      const response = await fetch(`./api/fetch-subscription?url=${encodeURIComponent(candidate)}`)
      const content = await response.text()
      if (!response.ok) {
        try {
          const detail = JSON.parse(content) as { error?: string }
          throw new Error(detail.error || `订阅地址请求失败（${response.status}）`)
        } catch (caught) {
          if (caught instanceof Error) throw caught
          throw new Error(`订阅地址请求失败（${response.status}）`)
        }
      }
      await resolve(content, depth + 1)
    }
  }

  await resolve(value, 0)
  if (!resolved.length) throw new Error('订阅内容中没有识别到真实节点')
  return [...new Set(resolved)]
}

export function encodeSubscription(nodes: ProxyNode[]) {
  const text = nodes.filter((node) => node.enabled).map((node) => node.url).join('\n')
  return btoa(unescape(encodeURIComponent(text)))
}

export function createNodeId() {
  return globalThis.crypto?.randomUUID?.() ?? `node-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
