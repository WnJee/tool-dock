export const MOVIE_GENRES = [
  { id: 28, name: '动作' },
  { id: 12, name: '冒险' },
  { id: 16, name: '动画' },
  { id: 35, name: '喜剧' },
  { id: 80, name: '犯罪' },
  { id: 99, name: '纪录片' },
  { id: 18, name: '剧情' },
  { id: 10751, name: '家庭' },
  { id: 14, name: '奇幻' },
  { id: 36, name: '历史' },
  { id: 27, name: '恐怖' },
  { id: 10402, name: '音乐' },
  { id: 9648, name: '悬疑' },
  { id: 10749, name: '爱情' },
  { id: 878, name: '科幻' },
  { id: 53, name: '惊悚' },
  { id: 10752, name: '战争' },
  { id: 37, name: '西部' },
] as const

export const MOVIE_REGIONS = [
  { code: 'CN', name: '中国大陆' },
  { code: 'HK', name: '中国香港' },
  { code: 'TW', name: '中国台湾' },
  { code: 'JP', name: '日本' },
  { code: 'KR', name: '韩国' },
  { code: 'US', name: '美国' },
  { code: 'GB', name: '英国' },
  { code: 'FR', name: '法国' },
  { code: 'DE', name: '德国' },
  { code: 'IN', name: '印度' },
] as const

export const TV_GENRES = [
  { id: 10759, name: '动作冒险' },
  { id: 16, name: '动画' },
  { id: 35, name: '喜剧' },
  { id: 80, name: '犯罪' },
  { id: 99, name: '纪录片' },
  { id: 18, name: '剧情' },
  { id: 10751, name: '家庭' },
  { id: 10762, name: '儿童' },
  { id: 9648, name: '悬疑' },
  { id: 10763, name: '新闻' },
  { id: 10764, name: '真人秀' },
  { id: 10765, name: '科幻奇幻' },
  { id: 10766, name: '肥皂剧' },
  { id: 10767, name: '脱口秀' },
  { id: 10768, name: '战争政治' },
  { id: 37, name: '西部' },
] as const

export interface MovieFilters {
  query: string
  person: string
  genre: string
  region: string
  yearFrom: string
  yearTo: string
  rating: string
  sort: string
}

export interface MovieSummary {
  id: number
  title: string
  originalTitle: string
  overview: string
  posterPath: string | null
  releaseDate: string
  rating: number
  voteCount: number
  genreIds: number[]
}

export interface MovieSearchResponse {
  page: number
  totalPages: number
  totalResults: number
  results: MovieSummary[]
  matchedPerson?: string
  filteredLocally?: boolean
}

export async function searchMovies(filters: MovieFilters, page: number, signal?: AbortSignal): Promise<MovieSearchResponse> {
  return searchMedia('/api/movies', filters, page, signal, '影片数据加载失败')
}

export async function searchTvShows(filters: MovieFilters, page: number, signal?: AbortSignal): Promise<MovieSearchResponse> {
  return searchMedia('/api/tv', filters, page, signal, '电视剧数据加载失败')
}

async function searchMedia(
  endpoint: string,
  filters: MovieFilters,
  page: number,
  signal: AbortSignal | undefined,
  fallbackError: string,
): Promise<MovieSearchResponse> {
  const params = new URLSearchParams({
    page: String(page),
    query: filters.query.trim(),
    person: filters.person.trim(),
    genre: filters.genre,
    region: filters.region,
    yearFrom: filters.yearFrom,
    yearTo: filters.yearTo,
    rating: filters.rating,
    sort: filters.sort,
  })
  const response = await fetch(`${endpoint}?${params}`, { signal })
  const body = (await response.json().catch(() => null)) as MovieSearchResponse | { error?: string } | null
  if (!response.ok) throw new Error(body && 'error' in body && body.error ? body.error : fallbackError)
  return body as MovieSearchResponse
}

export function getGenreNames(ids: number[], mediaType: 'movie' | 'tv' = 'movie'): string[] {
  const genres = mediaType === 'tv' ? TV_GENRES : MOVIE_GENRES
  const names = new Map<number, string>(genres.map((genre) => [genre.id, genre.name]))
  return ids.map((id) => names.get(id)).filter((name): name is string => Boolean(name))
}
