import { Star, type LucideIcon } from 'lucide-react'

interface FavoriteButtonProps {
  favorite: boolean
  onToggle: () => void
  icon?: LucideIcon
}

export default function FavoriteButton({ favorite, onToggle, icon: Icon = Star }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={`favorite-button ${favorite ? 'active' : ''}`}
      aria-pressed={favorite}
      aria-label={favorite ? '取消收藏' : '收藏'}
      onClick={onToggle}
    >
      <Icon size={16} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? '已收藏' : '收藏'}
    </button>
  )
}
