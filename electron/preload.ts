import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Notion 데이터
  fetchNotionItems: () => ipcRenderer.invoke('notion:fetch-items'),
  searchDatabases: (token: string) => ipcRenderer.invoke('notion:search-databases', token),
  getDatabaseProperties: (token: string, dbId: string) =>
    ipcRenderer.invoke('notion:get-properties', token, dbId),

  // 인증
  saveToken: (token: string) => ipcRenderer.invoke('auth:save-token', token),
  getToken: () => ipcRenderer.invoke('auth:get-token'),
  clearToken: () => ipcRenderer.invoke('auth:clear-token'),

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
})
