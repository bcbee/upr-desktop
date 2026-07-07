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
  // Downloaded updates install on quit (autoInstallOnAppQuit, default true).
  // Never quitAndInstall() here: the check runs at launch, so the download can
  // finish right as the user starts presenting, and a forced restart would kill
  // an active presentation.

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
