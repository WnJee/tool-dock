import type { LucideIcon } from 'lucide-react'

export type ToolId = 'base64' | 'base58' | 'json' | 'url' | 'timestamp'

export interface ToolDefinition {
  id: ToolId
  name: string
  description: string
  icon: LucideIcon
  color: string
  placeholder: string
}

export interface SiteDefinition {
  id: string
  name: string
  description: string
  url: string
  color: string
  initials: string
}

export type ActiveView =
  | { type: 'home' }
  | { type: 'checkin' }
  | { type: 'tool'; id: ToolId }
  | { type: 'site'; id: string }
