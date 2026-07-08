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
    const outcome = await waitForManualUpdateOutcome()
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

function waitForManualUpdateOutcome(): Promise<ManualUpdateOutcome> {
  return new Promise((resolve, reject) => {
    let settled = false

    const cleanup = (): void => {
      autoUpdater.removeListener('update-available', onUpdateAvailable)
      autoUpdater.removeListener('update-not-available', onUpdateNotAvailable)
      autoUpdater.removeListener('error', onError)
    }

    const settle = (outcome: ManualUpdateOutcome): void => {
      if (settled) return
      settled = true
      cleanup()
      resolve(outcome)
    }

    const fail = (error: unknown): void => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
    }

    const onUpdateAvailable = (): void => settle('update-available')
    const onUpdateNotAvailable = (): void => settle('update-not-available')
    const onError = (error: Error): void => fail(error)

    autoUpdater.once('update-available', onUpdateAvailable)
    autoUpdater.once('update-not-available', onUpdateNotAvailable)
    autoUpdater.once('error', onError)

    try {
      autoUpdater.checkForUpdates().then(
        result => {
          if (result === null) {
            settle('update-not-available')
          }
        },
        fail
      )
    } catch (error) {
      fail(error)
    }
  })
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
