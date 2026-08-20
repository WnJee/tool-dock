interface Env { NODE_SUBSCRIPTIONS: KVNamespace }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const content = await env.NODE_SUBSCRIPTIONS.get('default') ?? ''
  return new Response(content, { headers: { 'content-type': 'text/plain; charset=utf-8', 'content-disposition': 'inline', 'cache-control': 'no-store' } })
}
