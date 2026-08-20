interface Env { NODE_SUBSCRIPTIONS: KVNamespace; NODE_ADMIN_TOKEN: string }

function unauthorized() { return new Response('Unauthorized', { status: 401 }) }
function isAuthorized(request: Request, env: Env) { return Boolean(env.NODE_ADMIN_TOKEN) && request.headers.get('authorization') === `Bearer ${env.NODE_ADMIN_TOKEN}` }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!isAuthorized(request, env)) return unauthorized()
  return Response.json({ content: await env.NODE_SUBSCRIPTIONS.get('default') ?? '' })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!isAuthorized(request, env)) return unauthorized()
  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object' || !('content' in payload) || typeof payload.content !== 'string') return new Response('Invalid subscription content', { status: 400 })
  await env.NODE_SUBSCRIPTIONS.put('default', payload.content)
  return new Response(null, { status: 204 })
}
