import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import log from 'electron-log/main'
import * as Sentry from '@sentry/electron/main'
import { registerIpc } from './ipc'
import { buildMenu } from './menu'
import { initAutoUpdates } from './updater'
import { stopListening } from './socket'

Sentry.init({ dsn: 'https://cf07bcc0594241ce8c7db854e0f3f65a@sentry.io/1297683' })
log.initialize()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (process.env.START_MINIMIZED) mainWindow?.minimize()
    else mainWindow?.show()
  })

  // Keep external links in the user's browser instead of opening app windows.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  buildMenu(mainWindow)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  log.info('App started')
  registerIpc()
  createWindow()
  initAutoUpdates()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopListening()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopListening()
})
