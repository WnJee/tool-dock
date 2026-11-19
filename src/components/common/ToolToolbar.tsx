import type { ReactNode } from 'react'

interface ToolToolbarProps {
  /** 通常是 <Tabs /> */
  tabs: ReactNode
  controls: ReactNode
  className?: string
  controlsClassName?: string
}

export default function ToolToolbar({ tabs, controls, className = '', controlsClassName = '' }: ToolToolbarProps) {
  return (
    <div className={`crypto-toolbar ${className}`.trim()}>
      {tabs}
      <div className={`crypto-controls ${controlsClassName}`.trim()}>{controls}</div>
    </div>
  )
}
