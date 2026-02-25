/// <reference types="vite/client" />

interface ElectronAPI {
  // Notion 데이터
  fetchNotionItems: () => Promise<import('./types/widget').WidgetItem[]>
  searchDatabases: (token: string) => Promise<import('./types/notion').NotionDatabase[]>
  getDatabaseProperties: (token: string, dbId: string) => Promise<Record<string, { id: string; name: string; type: string }>>

  // 인증
  saveToken: (token: string) => Promise<void>
  getToken: () => Promise<string | undefined>
  clearToken: () => Promise<void>

  // 설정
  getSettings: () => Promise<Record<string, unknown>>
  setSettings: (settings: Record<string, unknown>) => Promise<void>

  // 이벤트
  onItemsUpdated: (callback: (items: import('./types/widget').WidgetItem[]) => void) => () => void
  onRefresh: (callback: () => void) => () => void
  onSettingsUpdated: (callback: (settings: unknown) => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
