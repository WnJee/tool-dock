import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description: ReactNode
  color: string
  action?: ReactNode
}

export default function PageHeader({ icon: Icon, title, description, color, action }: PageHeaderProps) {
  return (
    <header className="page-heading page-header">
      <div className="heading-main">
        <span className="tool-icon large" style={{ color, background: `${color}18` }}>
          <Icon size={25} />
        </span>
        <div className="page-title-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="page-header-action">{action}</div>
    </header>
  )
}
