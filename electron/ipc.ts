import { app, ipcMain, BrowserWindow } from 'electron'
import { searchDatabases, getDatabaseProperties, fetchTodos, fetchHabits } from './notionApiMain'
import { getStore, saveOAuthTokens, getOAuthTokens, clearOAuthTokens } from './store'
import { startOAuthFlow } from './oauth'

export function setupIpcHandlers() {
  const store = getStore()

  // --- 인증 (OAuth) ---

  ipcMain.handle('auth:start-oauth', async () => {
    try {
      const tokens = await startOAuthFlow()
      saveOAuthTokens({
        access_token: tokens.access_token,
        workspace_id: tokens.workspace_id,
        workspace_name: tokens.workspace_name,
        workspace_icon: tokens.workspace_icon,
        bot_id: tokens.bot_id,
      })
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('auth:status-changed', {
          connected: true,
          workspace_name: tokens.workspace_name,
          workspace_icon: tokens.workspace_icon,
        })
      })
      return { success: true, workspace_name: tokens.workspace_name }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('auth:get-status', async () => {
    const tokens = getOAuthTokens()
    if (!tokens) return { connected: false }
    return {
      connected: true,
      workspace_name: tokens.workspace_name,
      workspace_icon: tokens.workspace_icon,
    }
  })

  ipcMain.handle('auth:disconnect', async () => {
    clearOAuthTokens()
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('auth:status-changed', { connected: false })
    })
  })

  // --- Notion 데이터 (토큰 내부 조회) ---

  ipcMain.handle('notion:search-databases', async () => {
    const token = getAccessToken()
    if (!token) throw new Error('Not connected to Notion')
    return searchDatabases(token)
  })

  ipcMain.handle('notion:get-properties', async (_event, databaseId: string) => {
    const token = getAccessToken()
    if (!token) throw new Error('Not connected to Notion')
    return getDatabaseProperties(token, databaseId)
  })

  ipcMain.handle('notion:fetch-items', async () => {
    const token = getAccessToken()
    if (!token) throw new Error('No Notion token configured')

    const settings = store.get('settings') as any || {}
    const items: any[] = []

    if (settings.todoDatabaseId && settings.todoPropertyMapping) {
      const todos = await fetchTodos(token, settings.todoDatabaseId, settings.todoPropertyMapping)
      items.push(...todos.map((t: any) => ({ ...t, source: 'todo' })))
    }

    if (settings.habitDatabaseId && settings.habitPropertyMapping) {
      const habits = await fetchHabits(token, settings.habitDatabaseId, settings.habitPropertyMapping)
      items.push(...habits.map((h: any) => ({ ...h, source: 'habit' })))
    }

    return items
  })

  // --- 설정 ---

  ipcMain.handle('settings:get', () => {
    return store.get('settings') || {}
  })

  ipcMain.handle('settings:set', (_event, settings: Record<string, unknown>) => {
    const current = (store.get('settings') as Record<string, unknown>) || {}
    const merged = { ...current, ...settings }
    store.set('settings', merged)

    if ('launchAtStartup' in settings) {
      app.setLoginItemSettings({
        openAtLogin: !!settings.launchAtStartup,
      })
    }

    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('settings:updated', merged)
    })
  })
}

function getAccessToken(): string | null {
  const tokens = getOAuthTokens()
  return tokens?.access_token || null
}
