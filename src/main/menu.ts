import { app, Menu, shell, BrowserWindow } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { checkForUpdates, enableBetaUpdates } from './updater'

const helpSubmenu: MenuItemConstructorOptions = {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click: () => {
        shell.openExternal('https://universalpresenterremote.com')
      }
    },
    {
      label: 'Support',
      click: () => {
        shell.openExternal('mailto:support@dbztech.com')
      }
    },
    { label: 'Check For Updates', click: () => checkForUpdates() },
    { label: 'Enable Beta Updates', click: () => enableBetaUpdates() }
  ]
}

export function buildMenu(mainWindow: BrowserWindow): Menu {
  const isMac = process.platform === 'darwin'
  const isDev = !app.isPackaged
  const template: MenuItemConstructorOptions[] = []

  if (isMac) {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about', label: 'About UPR' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide UPR' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit UPR' }
      ]
    })
    template.push({ role: 'editMenu' })
  } else {
    template.push({
      label: '&File',
      submenu: [{ role: 'close', label: '&Close' }]
    })
  }

  const viewSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Toggle Full Screen',
      accelerator: isMac ? 'Ctrl+Command+F' : 'F11',
      click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
  ]
  if (isDev) {
    viewSubmenu.unshift({ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' })
  }
  template.push({ label: '&View', submenu: viewSubmenu })

  if (isMac) {
    template.push({
      role: 'windowMenu'
    })
  }

  template.push(helpSubmenu)

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  return menu
}
