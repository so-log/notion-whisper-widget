import { app, BrowserWindow, screen, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import { deflateSync } from 'node:zlib'
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

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function createTrayIcon(): Electron.NativeImage {
  const size = 16
  // PNG raw: each row = 1 filter byte + width * 4 (RGBA)
  const raw = Buffer.alloc(size * (1 + size * 4))

  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4)
    raw[row] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const px = row + 1 + x * 4
      const inBody = x >= 2 && x <= 13 && y >= 2 && y <= 10
      const inTail = x >= 3 && x <= 5 && y >= 11 && y <= 13
      if (inBody || inTail) {
        raw[px] = 100; raw[px + 1] = 100; raw[px + 2] = 100; raw[px + 3] = 230
      }
    }
  }

  // IHDR: width, height, bit depth 8, color type 6 (RGBA)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])

  return nativeImage.createFromBuffer(png)
}

function createTray() {
  const icon = createTrayIcon()
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

  // Windows: 좌클릭 시 메뉴 표시, 우클릭은 자동으로 contextMenu 표시
  if (!isMac) {
    tray.on('click', () => {
      tray?.popUpContextMenu()
    })
  }
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
