import { app } from 'electron'
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { join } from 'node:path'

type Platform = 'win32' | 'darwin'
type WindowsKeySender = {
  sendLeft(): void
  sendRight(): void
}

const LEFT_ARROW_SCRIPT = 'tell application "System Events"\nkey code 123\nend tell'
const RIGHT_ARROW_SCRIPT = 'tell application "System Events"\nkey code 124\nend tell'
const nativeRequire = createRequire(__filename)
let windowsKeySender: WindowsKeySender | undefined

export function leftArrow(): Promise<void> {
  return sendArrow('left')
}

export function rightArrow(): Promise<void> {
  return sendArrow('right')
}

export function hasPermissions(): Promise<boolean> {
  switch (getSupportedPlatform()) {
    case 'darwin':
      return runAppleScript(RIGHT_ARROW_SCRIPT).then(
        () => true,
        () => false
      )
    case 'win32':
      return Promise.resolve(true)
    default:
      return Promise.resolve(false)
  }
}

function sendArrow(direction: 'left' | 'right'): Promise<void> {
  switch (getSupportedPlatform()) {
    case 'darwin':
      return runAppleScript(direction === 'left' ? LEFT_ARROW_SCRIPT : RIGHT_ARROW_SCRIPT)
    case 'win32':
      return sendWindowsArrow(direction)
    default:
      return Promise.reject(new Error('Unsupported platform'))
  }
}

function getSupportedPlatform(): Platform | undefined {
  return process.platform === 'win32' || process.platform === 'darwin' ? process.platform : undefined
}

function runAppleScript(script: string): Promise<void> {
  return exec('osascript', ['-e', script])
}

function sendWindowsArrow(direction: 'left' | 'right'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const sender = getWindowsKeySender()
      if (direction === 'left') {
        sender.sendLeft()
      } else {
        sender.sendRight()
      }
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

function getWindowsKeySender(): WindowsKeySender {
  windowsKeySender ??= nativeRequire(getWindowsKeySenderPath()) as WindowsKeySender
  return windowsKeySender
}

function getWindowsKeySenderPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'native', 'keysender.node')
  }

  return join(app.getAppPath(), 'native', 'win-keysender', 'build', 'Release', 'keysender.node')
}

function exec(file: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(file, args, error => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}
