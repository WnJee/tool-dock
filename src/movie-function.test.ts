import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequestGet } from '../functions/api/movies'

afterEach(() => vi.unstubAllGlobals())

describe('movie Pages Function', () => {
  it('requires a TMDB token', async () => {
    const response = await onRequestGet({ request: new Request('https://example.com/api/movies'), env: {} })
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: '尚未配置 TMDB Read Access Token' })
  })

  it('maps TMDB discover results into the public response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      page: 1,
      total_pages: 12,
      total_results: 230,
      results: [{
        id: 550,
        title: '搏击俱乐部',
        original_title: 'Fight Club',
        overview: '简介',
        poster_path: '/poster.jpg',
        release_date: '1999-10-15',
        vote_average: 8.4,
        vote_count: 30000,
        genre_ids: [18],
      }],
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await onRequestGet({
      request: new Request('https://example.com/api/movies?genre=18&yearFrom=1990&rating=8&sort=vote_average.desc'),
      env: { TMDB_READ_TOKEN: 'token' },
    })
    const body = await response.json() as { totalResults: number; results: Array<{ title: string; rating: number }> }

    expect(response.status).toBe(200)
    expect(body.totalResults).toBe(230)
    expect(body.results[0]).toMatchObject({ title: '搏击俱乐部', rating: 8.4 })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0] as [URL, { headers: { Authorization: string } }]
    expect(url.pathname).toBe('/3/discover/movie')
    expect(url.searchParams.get('with_genres')).toBe('18')
    expect(url.searchParams.get('vote_average.gte')).toBe('8')
    expect(options.headers.Authorization).toBe('Bearer token')
  })
})

