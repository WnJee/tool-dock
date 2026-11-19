import type { ReactNode } from 'react'
import PageHeader from '../layout/PageHeader'
import FavoriteButton from './FavoriteButton'
import type { ToolDefinition } from '../../types'

interface ToolPageShellProps {
  tool: ToolDefinition
  favorite: boolean
  onFavorite: () => void
  /** 覆盖默认的 tool.description，例如附加当前算法说明 */
  description?: ReactNode
  className?: string
  children: ReactNode
}

export default function ToolPageShell({ tool, favorite, onFavorite, description, className = '', children }: ToolPageShellProps) {
  return (
    <div className={`content-page tool-page page-container ${className}`.trim()}>
      <PageHeader
        icon={tool.icon}
        title={tool.name}
        description={description ?? tool.description}
        color={tool.color}
        action={<FavoriteButton favorite={favorite} onToggle={onFavorite} icon={tool.icon} />}
      />
      {children}
    </div>
  )
}
