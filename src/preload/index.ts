import { contextBridge, ipcRenderer } from 'electron'
import type { UprApi } from '../shared/types'

const api: UprApi = {
  platform: process.platform,
  joinSession: token => ipcRenderer.invoke('upr:joinSession', token),
  startListening: (token, holdFor) => ipcRenderer.invoke('upr:startListening', token, holdFor),
  stopListening: () => ipcRenderer.invoke('upr:stopListening'),
  hasPermissions: () => ipcRenderer.invoke('upr:hasPermissions'),
  showError: (title, message) => ipcRenderer.invoke('upr:showError', title, message),
  openExternal: url => ipcRenderer.invoke('upr:openExternal', url)
}

contextBridge.exposeInMainWorld('upr', api)
