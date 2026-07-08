import { ipcMain, dialog, shell } from 'electron'
import { joinSession } from './session'
import { startListening, stopListening } from './socket'
import { hasPermissions } from './keys'

export function registerIpc(): void {
  ipcMain.handle('upr:joinSession', (_e, token: string) => joinSession(token))

  ipcMain.handle('upr:startListening', (_e, token: string, holdFor: string) => {
    startListening(token, holdFor)
  })

  ipcMain.handle('upr:stopListening', () => {
    stopListening()
  })

  ipcMain.handle('upr:hasPermissions', () => hasPermissions())

  ipcMain.handle('upr:showError', (_e, title: string, message: string) => {
    dialog.showErrorBox(title, message)
  })

  ipcMain.handle('upr:openExternal', (_e, url: string) => shell.openExternal(url))
}
