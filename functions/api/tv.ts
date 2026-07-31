interface Env {
  TMDB_READ_TOKEN?: string
  TMDB_API_KEY?: string
}

interface Context {
  request: Request
  env: Env
}

interface TmdbTvShow {
  id: number
  name?: string
  original_name?: string
  overview?: string
  poster_path?: string | null
  first_air_date?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  origin_country?: string[]
  popularity?: number
}

interface TmdbResponse {
  page: number
  total_pages: number
  total_results: number
  results: TmdbTvShow[]
}

const TMDB_API = 'https://api.themoviedb.org/3'
const SORT_OPTIONS = new Set(['popularity.desc', 'vote_average.desc', 'first_air_date.desc', 'first_air_date.asc'])

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  if (!env.TMDB_READ_TOKEN && !env.TMDB_API_KEY) return json({ error: '尚未配置 TMDB API 凭据' }, 503)

  const input = new URL(request.url).searchParams
  const page = clampNumber(input.get('page'), 1, 500, 1)
  const query = input.get('query')?.trim().slice(0, 100) ?? ''
  const person = input.get('person')?.trim().slice(0, 100) ?? ''
  const genre = input.get('genre') ?? ''
  const region = /^[A-Z]{2}$/.test(input.get('region') ?? '') ? input.get('region')! : ''
  const yearFrom = clampNumber(input.get('yearFrom'), 1888, 2100)
  const yearTo = clampNumber(input.get('yearTo'), 1888, 2100)
  const rating = clampNumber(input.get('rating'), 0, 10)
  const requestedSort = input.get('sort')?.replace('primary_release_date', 'first_air_date') ?? ''
  const sort = SORT_OPTIONS.has(requestedSort) ? requestedSort : 'popularity.desc'
  const headers = { ...(env.TMDB_READ_TOKEN ? { Authorization: `Bearer ${env.TMDB_READ_TOKEN}` } : {}), accept: 'application/json' }
  const apiKey = env.TMDB_READ_TOKEN ? undefined : env.TMDB_API_KEY
  const fetchTmdb = <T>(path: string, params: Record<string, string | number>) => tmdbFetch<T>(path, params, headers, apiKey)

  try {
    let personId: number | undefined
    let matchedPerson: string | undefined
    if (person) {
      const people = await fetchTmdb<{ results: Array<{ id: number; name: string }> }>('/search/person', { query: person, language: 'zh-CN' })
      personId = people.results[0]?.id
      matchedPerson = people.results[0]?.name
      if (!personId) return json({ page: 1, totalPages: 0, totalResults: 0, results: [] })
    }

    if (personId && !query) {
      const credits = await fetchTmdb<{ cast: TmdbTvShow[]; crew: TmdbTvShow[] }>(`/person/${personId}/tv_credits`, { language: 'zh-CN' })
      const shows = [...new Map([...credits.cast, ...credits.crew].map((show) => [show.id, show])).values()]
        .filter((show) => matchesFilters(show, genre, region, yearFrom, yearTo, rating))
        .sort(tvSorter(sort))
      const pageSize = 20
      return json({
        page,
        totalPages: Math.ceil(shows.length / pageSize),
        totalResults: shows.length,
        matchedPerson,
        results: shows.slice((page - 1) * pageSize, page * pageSize).map(mapTvShow),
      })
    }

    const useTitleSearch = Boolean(query)
    const params: Record<string, string | number> = useTitleSearch
      ? { query, language: 'zh-CN', include_adult: 'false', page }
      : {
          language: 'zh-CN', include_adult: 'false', page, sort_by: sort,
          ...(genre ? { with_genres: genre } : {}),
          ...(region ? { with_origin_country: region } : {}),
          ...(yearFrom ? { 'first_air_date.gte': `${yearFrom}-01-01` } : {}),
          ...(yearTo ? { 'first_air_date.lte': `${yearTo}-12-31` } : {}),
          ...(rating ? { 'vote_average.gte': rating, 'vote_count.gte': 20 } : sort === 'vote_average.desc' ? { 'vote_count.gte': 100 } : {}),
        }
    const response = await fetchTmdb<TmdbResponse>(useTitleSearch ? '/search/tv' : '/discover/tv', params)
    let results = response.results

    if (useTitleSearch) {
      let personTvIds: Set<number> | undefined
      if (personId) {
        const credits = await fetchTmdb<{ cast: TmdbTvShow[]; crew: TmdbTvShow[] }>(`/person/${personId}/tv_credits`, { language: 'zh-CN' })
        personTvIds = new Set([...credits.cast, ...credits.crew].map((show) => show.id))
      }
      results = results.filter((show) => (!personTvIds || personTvIds.has(show.id)) && matchesFilters(show, genre, region, yearFrom, yearTo, rating))
      results.sort(tvSorter(sort))
    }

    return json({
      page: response.page,
      totalPages: Math.min(response.total_pages, 500),
      totalResults: response.total_results,
      filteredLocally: useTitleSearch && Boolean(personId || genre || region || yearFrom || yearTo || rating),
      matchedPerson,
      results: results.map(mapTvShow),
    })
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'TMDB 请求失败'
    return json({ error: message }, 502)
  }
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number>, headers: Record<string, string>, apiKey?: string): Promise<T> {
  const url = new URL(`${TMDB_API}${path}`)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)))
  if (apiKey) url.searchParams.set('api_key', apiKey)
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(response.status === 401 ? 'TMDB Token 无效或已过期' : `TMDB 服务返回 ${response.status}`)
  return response.json() as Promise<T>
}

function tvSorter(sort: string) {
  return (left: TmdbTvShow, right: TmdbTvShow) => {
    if (sort === 'vote_average.desc') return (right.vote_average ?? 0) - (left.vote_average ?? 0)
    if (sort === 'first_air_date.asc') return (left.first_air_date ?? '').localeCompare(right.first_air_date ?? '')
    if (sort === 'first_air_date.desc') return (right.first_air_date ?? '').localeCompare(left.first_air_date ?? '')
    return (right.popularity ?? 0) - (left.popularity ?? 0)
  }
}

function matchesFilters(show: TmdbTvShow, genre: string, region: string, yearFrom?: number, yearTo?: number, rating?: number) {
  const airYear = Number(show.first_air_date?.slice(0, 4))
  return (!genre || show.genre_ids?.includes(Number(genre)))
    && (!region || show.origin_country?.includes(region))
    && (!yearFrom || airYear >= yearFrom)
    && (!yearTo || airYear <= yearTo)
    && (!rating || (show.vote_average ?? 0) >= rating)
}

function mapTvShow(show: TmdbTvShow) {
  return {
    id: show.id,
    title: show.name || show.original_name || '未命名剧集',
    originalTitle: show.original_name || show.name || '未命名剧集',
    overview: show.overview || '',
    posterPath: show.poster_path || null,
    releaseDate: show.first_air_date || '',
    rating: show.vote_average || 0,
    voteCount: show.vote_count || 0,
    genreIds: show.genre_ids || [],
  }
}

function clampNumber(value: string | null, min: number, max: number, fallback: number): number
function clampNumber(value: string | null, min: number, max: number, fallback?: number): number | undefined
function clampNumber(value: string | null, min: number, max: number, fallback?: number): number | undefined {
  if (!value) return fallback
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': status === 200 ? 'public, max-age=300' : 'no-store' } })
}
