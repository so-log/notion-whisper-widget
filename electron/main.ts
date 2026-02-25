import { app, BrowserWindow, screen, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { setupIpcHandlers } from './ipc'

let widgetWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const DIST_PATH = path.join(__dirname, '../dist')
const isMac = process.platform === 'darwin'

function createWidgetWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  widgetWindow = new BrowserWindow({
    width: screenWidth,
    height: screenHeight,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 데스크톱 레벨: 배경 바로 위
  if (isMac) {
    widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })
  }

  // 클릭 관통 설정
  widgetWindow.setIgnoreMouseEvents(true, { forward: true })

  if (VITE_DEV_SERVER_URL) {
    widgetWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    widgetWindow.loadFile(path.join(DIST_PATH, 'index.html'))
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null
  })
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 600,
    resizable: false,
    title: 'Notion Whisper 설정',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(`${VITE_DEV_SERVER_URL}#/settings`)
  } else {
    settingsWindow.loadFile(path.join(DIST_PATH, 'index.html'), { hash: '/settings' })
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function createTray() {
  // 16x16 트레이 아이콘 (간단한 말풍선 형태)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAjElEQVQ4T2NkoBAwUqifgWoGMDIy/mdkZPzPQKKLGP///8/AwMhYTrIBjIz/GRgZy4FuACmQIlANXA0DI+N/EEahHmQDQC4gxRCYAcguhBvAwFAOchYoFEA0ExAMyAbguAAUjMh8oo0E+QSZj90ABkaoIWSHAdwFyBaSrAbZEKINIPYkwowg3gUUAgDi5FgRvrJJRgAAAABJRU5ErkJggg=='
  )

  tray = new Tray(icon)
  tray.setToolTip('Notion Whisper')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '설정 열기',
      click: () => createSettingsWindow(),
    },
    {
      label: '새로고침',
      click: () => {
        widgetWindow?.webContents.send('notion:refresh')
      },
    },
    { type: 'separator' },
    {
      label: '위젯 숨기기/보이기',
      click: () => {
        if (widgetWindow?.isVisible()) {
          widgetWindow.hide()
        } else {
          widgetWindow?.show()
        }
      },
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => createSettingsWindow())
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWidgetWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // 트레이 아이콘이 있으므로 위젯 윈도우 닫혀도 앱 종료하지 않음
  if (!isMac) {
    // Windows: 모든 윈도우 닫혀도 트레이에서 계속 실행
  }
})
