interface Context {
  request: Request
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

export async function onRequestGet({ request }: Context): Promise<Response> {
  const target = new URL(request.url).searchParams.get('url')
  if (!target) return json({ error: '缺少订阅地址' }, 400)

  let url: URL
  try {
    url = new URL(target)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
  } catch {
    return json({ error: '订阅地址必须是 HTTP 或 HTTPS' }, 400)
  }

  try {
    const upstream = await fetch(url, {
      headers: { accept: 'text/plain, text/*, application/octet-stream, */*', 'user-agent': 'ToolDock Subscription Importer' },
      redirect: 'follow',
    })
    if (!upstream.ok) return json({ error: `订阅服务返回 ${upstream.status}` }, 502)
    const length = Number(upstream.headers.get('content-length') ?? 0)
    if (length > MAX_RESPONSE_BYTES) return json({ error: '订阅内容过大' }, 413)
    const body = await upstream.arrayBuffer()
    if (body.byteLength > MAX_RESPONSE_BYTES) return json({ error: '订阅内容过大' }, 413)
    return new Response(body, { headers: { 'content-type': upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
  } catch (caught) {
    return json({ error: caught instanceof Error ? caught.message : '订阅地址请求失败' }, 502)
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}
