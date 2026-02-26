import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Notion 데이터 (토큰은 메인 프로세스에서 내부 관리)
  fetchNotionItems: () => ipcRenderer.invoke('notion:fetch-items'),
  searchDatabases: () => ipcRenderer.invoke('notion:search-databases'),
  getDatabaseProperties: (dbId: string) =>
    ipcRenderer.invoke('notion:get-properties', dbId),

  // 인증 (OAuth)
  startOAuth: () => ipcRenderer.invoke('auth:start-oauth'),
  getAuthStatus: () => ipcRenderer.invoke('auth:get-status'),
  disconnect: () => ipcRenderer.invoke('auth:disconnect'),

  // 설정
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('settings:set', settings),

  // 이벤트 리스너
  onItemsUpdated: (callback: (items: unknown[]) => void) => {
    ipcRenderer.on('notion:items-updated', (_event, items) => callback(items))
    return () => { ipcRenderer.removeAllListeners('notion:items-updated') }
  },
  onRefresh: (callback: () => void) => {
    ipcRenderer.on('notion:refresh', () => callback())
    return () => { ipcRenderer.removeAllListeners('notion:refresh') }
  },
  onSettingsUpdated: (callback: (settings: unknown) => void) => {
    ipcRenderer.on('settings:updated', (_event, settings) => callback(settings))
    return () => { ipcRenderer.removeAllListeners('settings:updated') }
  },
  onAuthStatusChanged: (callback: (status: { connected: boolean; workspace_name?: string }) => void) => {
    ipcRenderer.on('auth:status-changed', (_event, status) => callback(status))
    return () => { ipcRenderer.removeAllListeners('auth:status-changed') }
  },
})
