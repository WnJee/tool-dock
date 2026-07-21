import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink, Film, RotateCcw, Search, Star } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import { getGenreNames, MOVIE_GENRES, searchMovies } from '../movie-api'
import type { MovieFilters, MovieSearchResponse, MovieSummary } from '../movie-api'

const DEFAULT_FILTERS: MovieFilters = {
  query: '',
  person: '',
  genre: '',
  yearFrom: '',
  yearTo: '',
  rating: '',
  sort: 'popularity.desc',
}

function MovieLibraryPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const [data, setData] = useState<MovieSearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestRef = useRef<AbortController | null>(null)

  const loadMovies = async (nextFilters: MovieFilters, page = 1) => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    setError('')
    try {
      setData(await searchMovies(nextFilters, page, controller.signal))
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError(caught instanceof Error ? caught.message : '影片数据加载失败')
      setData(null)
    } finally {
      if (requestRef.current === controller) setLoading(false)
    }
  }

  useEffect(() => {
    loadMovies(DEFAULT_FILTERS)
    return () => requestRef.current?.abort()
  }, [])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setAppliedFilters(filters)
    loadMovies(filters)
  }

  const reset = () => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    loadMovies(DEFAULT_FILTERS)
  }

  const changePage = (page: number) => {
    loadMovies(appliedFilters, page)
    document.querySelector('.workspace')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="content-page movie-page page-container">
      <PageHeader icon={Film} title="影片库" description="TMDB 电影目录 · 中文信息、条件筛选与豆瓣搜索入口" color="#ef7185" />

      <form className="movie-filters" onSubmit={submit}>
        <label className="movie-query"><span>片名</span><div><Search size={15} /><input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="中文名、原名或关键词" /></div></label>
        <label><span>演员 / 导演</span><input value={filters.person} onChange={(event) => setFilters({ ...filters, person: event.target.value })} placeholder="例如：梁朝伟" /></label>
        <label><span>类型</span><select value={filters.genre} onChange={(event) => setFilters({ ...filters, genre: event.target.value })}><option value="">全部类型</option>{MOVIE_GENRES.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select></label>
        <label><span>年份</span><div className="year-range"><input type="number" min="1888" max="2100" value={filters.yearFrom} onChange={(event) => setFilters({ ...filters, yearFrom: event.target.value })} placeholder="起始" /><em>至</em><input type="number" min="1888" max="2100" value={filters.yearTo} onChange={(event) => setFilters({ ...filters, yearTo: event.target.value })} placeholder="结束" /></div></label>
        <label><span>最低评分</span><select value={filters.rating} onChange={(event) => setFilters({ ...filters, rating: event.target.value })}><option value="">不限</option><option value="6">6.0</option><option value="7">7.0</option><option value="8">8.0</option><option value="9">9.0</option></select></label>
        <label><span>排序</span><select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="popularity.desc">热度从高到低</option><option value="vote_average.desc">评分从高到低</option><option value="primary_release_date.desc">上映时间从新到旧</option><option value="primary_release_date.asc">上映时间从旧到新</option></select></label>
        <div className="movie-filter-actions"><button type="button" className="secondary-button" onClick={reset} title="重置筛选"><RotateCcw size={15} /> 重置</button><button type="submit" className="primary-button"><Search size={15} /> 搜索</button></div>
      </form>

      <section className="movie-results">
        <div className="movie-results-heading">
          <div><strong>{data ? `找到 ${data.totalResults.toLocaleString('zh-CN')} 部影片` : '影片目录'}</strong><span>{data?.matchedPerson ? `人物匹配：${data.matchedPerson}` : '评分来自 TMDB，豆瓣入口用于继续查看中文社区信息'}</span></div>
          {data && data.totalPages > 1 && <PageControls page={data.page} totalPages={data.totalPages} onChange={changePage} />}
        </div>

        {loading && <div className="movie-state"><span className="spinner" /><strong>正在加载影片</strong><small>从 TMDB 获取最新目录</small></div>}
        {!loading && error && <div className="movie-state error"><Film size={34} /><strong>影片库暂时不可用</strong><small>{error}</small><button className="secondary-button" onClick={() => loadMovies(appliedFilters)}>重新加载</button></div>}
        {!loading && !error && data?.results.length === 0 && <div className="movie-state"><Film size={34} /><strong>没有找到匹配影片</strong><small>可以减少筛选条件或尝试其他关键词</small></div>}
        {!loading && !error && data && data.results.length > 0 && <div className="movie-grid">{data.results.map((movie) => <MovieCard key={movie.id} movie={movie} />)}</div>}
        {!loading && !error && data && data.totalPages > 1 && <div className="movie-pagination"><PageControls page={data.page} totalPages={data.totalPages} onChange={changePage} /></div>}
      </section>
    </div>
  )
}

function MovieCard({ movie }: { movie: MovieSummary }) {
  const genres = getGenreNames(movie.genreIds).slice(0, 3)
  const year = movie.releaseDate.slice(0, 4) || '年份未知'
  const tmdbUrl = `https://www.themoviedb.org/movie/${movie.id}?language=zh-CN`
  const doubanUrl = `https://search.douban.com/movie/subject_search?search_text=${encodeURIComponent(`${movie.title} ${year}`)}`
  return (
    <article className="movie-card">
      <div className="movie-poster">{movie.posterPath ? <img src={`https://image.tmdb.org/t/p/w342${movie.posterPath}`} alt={`${movie.title} 海报`} loading="lazy" /> : <Film size={34} />}</div>
      <div className="movie-card-body">
        <div className="movie-card-title"><div><strong title={movie.title}>{movie.title}</strong>{movie.originalTitle !== movie.title && <span title={movie.originalTitle}>{movie.originalTitle}</span>}</div><em><Star size={12} fill="currentColor" /> {movie.rating ? movie.rating.toFixed(1) : '—'}</em></div>
        <div className="movie-meta"><span>{year}</span>{genres.map((genre) => <span key={genre}>{genre}</span>)}<span>{movie.voteCount.toLocaleString('zh-CN')} 人评分</span></div>
        <p>{movie.overview || '暂无中文剧情简介。'}</p>
        <div className="movie-links"><a href={tmdbUrl} target="_blank" rel="noreferrer">TMDB 详情 <ExternalLink size={13} /></a><a href={doubanUrl} target="_blank" rel="noreferrer">豆瓣搜索 <ExternalLink size={13} /></a></div>
      </div>
    </article>
  )
}

function PageControls({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return <div className="page-controls"><button disabled={page <= 1} onClick={() => onChange(page - 1)} title="上一页"><ArrowLeft size={15} /></button><span>第 {page} / {Math.min(totalPages, 500)} 页</span><button disabled={page >= Math.min(totalPages, 500)} onClick={() => onChange(page + 1)} title="下一页"><ArrowRight size={15} /></button></div>
}

export default MovieLibraryPage

