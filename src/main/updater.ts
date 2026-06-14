import { app } from 'electron'
import electronUpdater from 'electron-updater'
import log from 'electron-log/main'

// electron-updater is CommonJS; destructure the autoUpdater from the default export.
const { autoUpdater } = electronUpdater

export function initAutoUpdates(): void {
  autoUpdater.logger = log
  autoUpdater.on('error', error => {
    log.error('autoUpdater error', error)
  })
  // Restore the install-on-download flow the original app had commented out.
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
  })

  if (app.isPackaged) {
    log.info('Checking for updates...')
    autoUpdater.checkForUpdatesAndNotify()
  }
}

export function checkForUpdates(): void {
  log.info('Manual update check...')
  autoUpdater.checkForUpdates()
}

export function enableBetaUpdates(): void {
  autoUpdater.allowPrerelease = true
  checkForUpdates()
}
