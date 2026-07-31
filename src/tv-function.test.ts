import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequestGet } from '../functions/api/tv'

afterEach(() => vi.unstubAllGlobals())

describe('TV Pages Function', () => {
  it('requires a TMDB token', async () => {
    const response = await onRequestGet({ request: new Request('https://example.com/api/tv'), env: {} })
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: '尚未配置 TMDB API 凭据' })
  })

  it('maps TMDB discover results and TV-specific filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      page: 1,
      total_pages: 8,
      total_results: 150,
      results: [{
        id: 1396,
        name: '绝命毒师',
        original_name: 'Breaking Bad',
        overview: '简介',
        poster_path: '/poster.jpg',
        first_air_date: '2008-01-20',
        vote_average: 8.9,
        vote_count: 16000,
        genre_ids: [18],
      }],
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await onRequestGet({
      request: new Request('https://example.com/api/tv?genre=18&region=US&yearFrom=2000&rating=8&sort=primary_release_date.desc'),
      env: { TMDB_READ_TOKEN: 'token' },
    })
    const body = await response.json() as { totalResults: number; results: Array<{ title: string; releaseDate: string }> }

    expect(response.status).toBe(200)
    expect(body.totalResults).toBe(150)
    expect(body.results[0]).toMatchObject({ title: '绝命毒师', releaseDate: '2008-01-20' })
    const [url, options] = fetchMock.mock.calls[0] as [URL, { headers: { Authorization: string } }]
    expect(url.pathname).toBe('/3/discover/tv')
    expect(url.searchParams.get('with_origin_country')).toBe('US')
    expect(url.searchParams.get('first_air_date.gte')).toBe('2000-01-01')
    expect(url.searchParams.get('sort_by')).toBe('first_air_date.desc')
    expect(options.headers.Authorization).toBe('Bearer token')
  })

  it('uses TV credits for person-only filtering', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{ id: 42, name: '演员甲' }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        cast: [{ id: 1, name: '匹配剧集', first_air_date: '2024-01-01', origin_country: ['CN'], genre_ids: [18], vote_average: 8.2, popularity: 20 }],
        crew: [],
      })))
    vi.stubGlobal('fetch', fetchMock)

    const response = await onRequestGet({
      request: new Request('https://example.com/api/tv?person=演员甲&region=CN&genre=18&rating=8'),
      env: { TMDB_API_KEY: 'key' },
    })
    const body = await response.json() as { totalResults: number; matchedPerson: string; results: Array<{ title: string }> }

    expect(body).toMatchObject({ totalResults: 1, matchedPerson: '演员甲' })
    expect(body.results[0].title).toBe('匹配剧集')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [creditsUrl] = fetchMock.mock.calls[1] as [URL]
    expect(creditsUrl.pathname).toBe('/3/person/42/tv_credits')
  })
})
