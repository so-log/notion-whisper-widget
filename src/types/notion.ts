export interface NotionDatabase {
  id: string
  title: string
  icon?: string
}

export interface NotionProperty {
  id: string
  name: string
  type: string
}

export interface NotionItem {
  id: string
  title: string
  done: boolean
  date?: string
  priority?: number
  emoji?: string
}

export interface NotionApiError {
  status: number
  code: string
  message: string
}
