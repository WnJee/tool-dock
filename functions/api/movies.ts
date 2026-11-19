interface Env {
  TMDB_READ_TOKEN?: string
  TMDB_API_KEY?: string
}

interface Context {
  request: Request
  env: Env
}

interface TmdbMovie {
  id: number
  title?: string
  original_title?: string
  overview?: string
  poster_path?: string | null
  release_date?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  origin_country?: string[]
}

interface TmdbResponse {
  page: number
  total_pages: number
  total_results: number
  results: TmdbMovie[]
}

const TMDB_API = 'https://api.themoviedb.org/3'
const SORT_OPTIONS = new Set(['popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'primary_release_date.asc'])

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
  const sort = SORT_OPTIONS.has(input.get('sort') ?? '') ? input.get('sort')! : 'popularity.desc'
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

    const useTitleSearch = Boolean(query)
    const params: Record<string, string | number> = useTitleSearch
      ? { query, language: 'zh-CN', include_adult: 'false', page, ...(region ? { region } : {}) }
      : {
          language: 'zh-CN',
          include_adult: 'false',
          include_video: 'false',
          page,
          sort_by: sort,
          ...(personId ? { with_people: personId } : {}),
          ...(genre ? { with_genres: genre } : {}),
          ...(region ? { with_origin_country: region } : {}),
          ...(yearFrom ? { 'primary_release_date.gte': `${yearFrom}-01-01` } : {}),
          ...(yearTo ? { 'primary_release_date.lte': `${yearTo}-12-31` } : {}),
          ...(rating ? { 'vote_average.gte': rating, 'vote_count.gte': 20 } : sort === 'vote_average.desc' ? { 'vote_count.gte': 100 } : {}),
        }
    const response = await fetchTmdb<TmdbResponse>(useTitleSearch ? '/search/movie' : '/discover/movie', params)
    let results = response.results

    if (useTitleSearch) {
      let personMovieIds: Set<number> | undefined
      if (personId) {
        const credits = await fetchTmdb<{ cast: TmdbMovie[]; crew: TmdbMovie[] }>(`/person/${personId}/movie_credits`, { language: 'zh-CN' })
        personMovieIds = new Set([...credits.cast, ...credits.crew].map((movie) => movie.id))
      }
      results = results.filter((movie) => {
        const releaseYear = Number(movie.release_date?.slice(0, 4))
        return (
          (!personMovieIds || personMovieIds.has(movie.id)) &&
          (!genre || movie.genre_ids?.includes(Number(genre))) &&
          (!region || movie.origin_country?.includes(region)) &&
          (!yearFrom || releaseYear >= yearFrom) &&
          (!yearTo || releaseYear <= yearTo) &&
          (!rating || (movie.vote_average ?? 0) >= rating)
        )
      })
      results.sort(movieSorter(sort))
    }

    return json({
      page: response.page,
      totalPages: Math.min(response.total_pages, 500),
      totalResults: response.total_results,
      filteredLocally: useTitleSearch && Boolean(personId || genre || region || yearFrom || yearTo || rating),
      matchedPerson,
      results: results.map((movie) => ({
        id: movie.id,
        title: movie.title || movie.original_title || '未命名影片',
        originalTitle: movie.original_title || movie.title || '未命名影片',
        overview: movie.overview || '',
        posterPath: movie.poster_path || null,
        releaseDate: movie.release_date || '',
        rating: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        genreIds: movie.genre_ids || [],
      })),
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

function movieSorter(sort: string) {
  return (left: TmdbMovie, right: TmdbMovie) => {
    if (sort === 'vote_average.desc') return (right.vote_average ?? 0) - (left.vote_average ?? 0)
    if (sort === 'primary_release_date.asc') return (left.release_date ?? '').localeCompare(right.release_date ?? '')
    if (sort === 'primary_release_date.desc') return (right.release_date ?? '').localeCompare(left.release_date ?? '')
    return (right.vote_count ?? 0) - (left.vote_count ?? 0)
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
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': status === 200 ? 'public, max-age=300' : 'no-store' },
  })
}
