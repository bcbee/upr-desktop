import { app, dialog } from 'electron'
import electronUpdater from 'electron-updater'
import log from 'electron-log/main'

// electron-updater is CommonJS; destructure the autoUpdater from the default export.
const { autoUpdater } = electronUpdater
let manualUpdateCheckInProgress = false

type ManualUpdateOutcome = 'update-available' | 'update-not-available'

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
  void checkForUpdatesManually()
}

export function enableBetaUpdates(): void {
  autoUpdater.allowPrerelease = true
  checkForUpdates()
}

async function checkForUpdatesManually(): Promise<void> {
  log.info('Manual update check...')

  if (!app.isPackaged) {
    await dialog.showMessageBox({
      type: 'info',
      title: 'Check For Updates',
      message: 'Update checks are only available in packaged builds.'
    })
    return
  }

  if (manualUpdateCheckInProgress) {
    await dialog.showMessageBox({
      type: 'info',
      title: 'Check For Updates',
      message: 'An update check is already in progress.'
    })
    return
  }

  manualUpdateCheckInProgress = true
  try {
    const outcome = await resolveManualUpdateOutcome()
    if (outcome === 'update-not-available') {
      await dialog.showMessageBox({
        type: 'info',
        title: 'Check For Updates',
        message: 'Universal Presenter Remote is up to date.',
        detail: `Version ${app.getVersion()} is the latest available version.`
      })
      return
    }

    await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'An update is available and is being downloaded.',
      detail: 'It will be installed the next time you quit the app.'
    })
  } catch (error) {
    log.error('Manual update check failed', error)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Update Check Failed',
      message: 'Universal Presenter Remote could not check for updates.',
      detail: formatError(error)
    })
  } finally {
    manualUpdateCheckInProgress = false
  }
}

// Derive the outcome from the value checkForUpdates() resolves to, not from the
// one-shot 'update-available'/'update-not-available' events. electron-updater
// caches an in-flight check (AppUpdater.checkForUpdatesPromise): after launch's
// checkForUpdatesAndNotify() a manual check often piggybacks on that shared
// promise, whose events already fired before our listeners attached. The
// returned UpdateCheckResult still carries the authoritative isUpdateAvailable
// flag (and the promise rejects on error), so it always settles.
async function resolveManualUpdateOutcome(): Promise<ManualUpdateOutcome> {
  const result = await autoUpdater.checkForUpdates()
  // null means the updater is inactive (unpackaged); treated as up to date.
  return result?.isUpdateAvailable ? 'update-available' : 'update-not-available'
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
