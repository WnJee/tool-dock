import { useRef, useState } from 'react'
import { ExternalLink, Maximize2, RefreshCw, ShieldCheck, Star } from 'lucide-react'
import type { SiteDefinition } from '../types'

interface EmbeddedSitePageProps {
  site: SiteDefinition
  favorite: boolean
  onFavorite: () => void
}

export default function EmbeddedSitePage({ site, favorite, onFavorite }: EmbeddedSitePageProps) {
  const [frameKey, setFrameKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function reload() {
    setLoading(true)
    setFrameKey((key) => key + 1)
  }

  function fullscreen() {
    void iframeRef.current?.requestFullscreen()
  }

  return (
    <div className="site-page">
      <div className="site-toolbar">
        <div className="site-identity">
          <span className="site-logo" style={{ background: site.color }}>
            {site.initials}
          </span>
          <div>
            <strong>{site.name}</strong>
            <span>{site.description}</span>
          </div>
        </div>
        <div className="address-bar">
          <ShieldCheck size={14} />
          <span>{site.url}</span>
        </div>
        <div className="site-actions">
          <button className={`icon-button ${favorite ? 'active' : ''}`} onClick={onFavorite} title="收藏">
            <Star size={17} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-button" onClick={reload} title="刷新">
            <RefreshCw size={17} />
          </button>
          <button className="icon-button" onClick={fullscreen} title="全屏">
            <Maximize2 size={17} />
          </button>
          <a className="open-external" href={site.url} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> 新标签页
          </a>
        </div>
      </div>
      <div className="frame-wrap">
        {loading && (
          <div className="frame-loading">
            <span className="spinner" />
            <strong>正在连接 {site.name}</strong>
            <small>如果目标网站限制内嵌，可使用右上角“新标签页”打开</small>
          </div>
        )}
        <iframe
          key={frameKey}
          ref={iframeRef}
          src={site.url}
          title={site.name}
          onLoad={() => setLoading(false)}
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  )
}
