/// <reference types="vite/client" />

interface AuthStatus {
  connected: boolean
  workspace_name?: string
  workspace_icon?: string | null
}

interface OAuthResult {
  success: boolean
  workspace_name?: string
  error?: string
}

interface ElectronAPI {
  // Notion 데이터 (토큰 내부 관리)
  fetchNotionItems: () => Promise<import('./types/widget').WidgetItem[]>
  searchDatabases: () => Promise<import('./types/notion').NotionDatabase[]>
  getDatabaseProperties: (dbId: string) => Promise<Record<string, { id: string; name: string; type: string }>>

  // 인증 (OAuth)
  startOAuth: () => Promise<OAuthResult>
  getAuthStatus: () => Promise<AuthStatus>
  disconnect: () => Promise<void>

  // 설정
  getSettings: () => Promise<Record<string, unknown>>
  setSettings: (settings: Record<string, unknown>) => Promise<void>

  // 이벤트
  onItemsUpdated: (callback: (items: import('./types/widget').WidgetItem[]) => void) => () => void
  onRefresh: (callback: () => void) => () => void
  onSettingsUpdated: (callback: (settings: unknown) => void) => () => void
  onAuthStatusChanged: (callback: (status: AuthStatus) => void) => () => void
}

interface Window {
  electronAPI: ElectronAPI
}
