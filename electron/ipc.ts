import { app, ipcMain, safeStorage, BrowserWindow } from 'electron'
import { searchDatabases, getDatabaseProperties, fetchTodos, fetchHabits } from './notionApiMain'
import { getStore } from './store'

export function setupIpcHandlers() {
  const store = getStore()

  // 토큰 저장 (Electron safeStorage로 암호화)
  ipcMain.handle('auth:save-token', async (_event, token: string) => {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(token)
      store.set('notionTokenEncrypted', encrypted.toString('base64'))
    } else {
      store.set('notionToken', token)
    }
  })

  // 토큰 읽기
  ipcMain.handle('auth:get-token', async () => {
    const encrypted = store.get('notionTokenEncrypted') as string | undefined
    if (encrypted && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    }
    return store.get('notionToken') as string | undefined
  })

  // 토큰 삭제
  ipcMain.handle('auth:clear-token', async () => {
    store.delete('notionTokenEncrypted')
    store.delete('notionToken')
  })

  // DB 목록 조회
  ipcMain.handle('notion:search-databases', async (_event, token: string) => {
    return searchDatabases(token)
  })

  // DB 프로퍼티 조회
  ipcMain.handle('notion:get-properties', async (_event, token: string, databaseId: string) => {
    return getDatabaseProperties(token, databaseId)
  })

  // 할일 + 습관 통합 조회
  ipcMain.handle('notion:fetch-items', async () => {
    const token = await getToken()
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

  // 설정 읽기/쓰기
  ipcMain.handle('settings:get', () => {
    return store.get('settings') || {}
  })

  ipcMain.handle('settings:set', (_event, settings: Record<string, unknown>) => {
    const current = (store.get('settings') as Record<string, unknown>) || {}
    const merged = { ...current, ...settings }
    store.set('settings', merged)

    // 자동 실행 설정
    if ('launchAtStartup' in settings) {
      app.setLoginItemSettings({
        openAtLogin: !!settings.launchAtStartup,
      })
    }

    // 위젯 윈도우에 설정 변경 알림
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('settings:updated', merged)
    })
  })
}

async function getToken(): Promise<string | undefined> {
  const store = getStore()
  const encrypted = store.get('notionTokenEncrypted') as string | undefined
  if (encrypted && safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
  }
  return store.get('notionToken') as string | undefined
}
