export interface WidgetItem {
  id: string
  text: string
  done: boolean
  source: 'todo' | 'habit'
  emoji?: string
  priority?: number
}

export type WidgetPosition = 'bottomLeft' | 'topLeft' | 'center'

export type WidgetStatus = 'loading' | 'ready' | 'empty' | 'allDone' | 'error'

export interface WidgetSettings {
  position: WidgetPosition
  pollingInterval: number // ms
  notionToken?: string
  todoDatabaseId?: string
  habitDatabaseId?: string
  showWidget: boolean
  launchAtStartup: boolean
}

export const DEFAULT_SETTINGS: WidgetSettings = {
  position: 'bottomLeft',
  pollingInterval: 60000,
  showWidget: true,
  launchAtStartup: false,
}
