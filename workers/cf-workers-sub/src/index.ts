interface Env {
  NODE_SUBSCRIPTIONS: KVNamespace
  NODE_ADMIN_TOKEN: string
}

interface ProxyNode {
  id: string
  name: string
  url: string
  note: string
  enabled: boolean
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, PUT, OPTIONS',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
    if (url.pathname === '/subscription' || url.pathname === '/api/subscription') return subscription(env)
    if (url.pathname === '/fetch-subscription' || url.pathname === '/api/fetch-subscription') {
      if (!authorized(request, env)) return json({ error: '订阅解析需要管理令牌' }, 401)
      return fetchSubscription(url)
    }
    if (url.pathname === '/nodes' || url.pathname === '/api/nodes') {
      if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401)
      if (request.method === 'GET') return json({ nodes: await readNodes(env) })
      if (request.method === 'PUT') return saveNodes(request, env)
    }
    return json({ error: 'Not found' }, 404)
  },
}

async function fetchSubscription(requestUrl: URL) {
  const target = requestUrl.searchParams.get('url')
  if (!target) return json({ error: '缺少订阅地址' }, 400)
  let url: URL
  try {
    url = new URL(target)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
  } catch {
    return json({ error: '订阅地址必须是 HTTP 或 HTTPS' }, 400)
  }
  try {
    const upstream = await fetch(url, { headers: { accept: 'text/plain, text/*, application/octet-stream, */*', 'user-agent': 'ClashMeta/1.19.0' }, redirect: 'follow' })
    if (!upstream.ok) return json({ error: upstream.status === 403 ? '订阅源拒绝了 Cloudflare Worker 的请求（403）。请粘贴订阅客户端获取到的 Base64 内容。' : `订阅服务返回 ${upstream.status}` }, 502)
    const body = await upstream.arrayBuffer()
    if (body.byteLength > 2 * 1024 * 1024) return json({ error: '订阅内容过大' }, 413)
    return new Response(body, { headers: { ...corsHeaders, 'content-type': upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
  } catch (caught) {
    return json({ error: caught instanceof Error ? caught.message : '订阅地址请求失败' }, 502)
  }
}

async function subscription(env: Env) {
  const content = await env.NODE_SUBSCRIPTIONS.get('content') ?? await env.NODE_SUBSCRIPTIONS.get('default') ?? ''
  return new Response(content, { headers: { ...corsHeaders, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
}

async function readNodes(env: Env): Promise<ProxyNode[]> {
  const stored = await env.NODE_SUBSCRIPTIONS.get('nodes', 'json')
  return Array.isArray(stored) ? stored as ProxyNode[] : []
}

async function saveNodes(request: Request, env: Env) {
  const payload = await request.json().catch(() => null) as { nodes?: unknown; content?: unknown } | null
  if (!payload || !Array.isArray(payload.nodes)) return json({ error: 'nodes must be an array' }, 400)
  const nodes = payload.nodes.filter(isNode)
  if (nodes.length !== payload.nodes.length) return json({ error: 'invalid node data' }, 400)
  await env.NODE_SUBSCRIPTIONS.put('nodes', JSON.stringify(nodes))
  const content = encodeSubscription(nodes)
  await env.NODE_SUBSCRIPTIONS.put('content', content)
  await env.NODE_SUBSCRIPTIONS.put('default', content)
  return json({ ok: true, count: nodes.length })
}

function isNode(value: unknown): value is ProxyNode {
  if (!value || typeof value !== 'object') return false
  const node = value as Partial<ProxyNode>
  return typeof node.id === 'string' && typeof node.name === 'string' && typeof node.url === 'string' && typeof node.note === 'string' && typeof node.enabled === 'boolean' && !/^https?:\/\//i.test(node.url)
}

function encodeSubscription(nodes: ProxyNode[]) {
  const text = nodes.filter((node) => node.enabled).map((node) => node.url).join('\n')
  return btoa(unescape(encodeURIComponent(text)))
}

function authorized(request: Request, env: Env) {
  return Boolean(env.NODE_ADMIN_TOKEN) && request.headers.get('authorization') === `Bearer ${env.NODE_ADMIN_TOKEN}`
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}
