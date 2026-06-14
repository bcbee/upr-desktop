import io from 'socket.io-client'
import log from 'electron-log/main'
import * as Sentry from '@sentry/electron/main'
import { verifyMessage } from './verify'
import * as keys from './keys'
import type { SignedMessage, SlideAction } from '../shared/types'

const SERVER_URL = 'https://universalpresenterremote.com'

const SLIDE_UP: SlideAction = 'SlideUp'
const SLIDE_DOWN: SlideAction = 'SlideDown'
const PLAY_MEDIA: SlideAction = 'PlayMedia'

let socket: ReturnType<typeof io> | undefined
// Signatures already acted on, to drop replayed messages.
let seenSignatures = new Set<string>()

export function startListening(token: string, holdFor: string): void {
  stopListening()

  socket = io(SERVER_URL)
  socket.on('error', (e: unknown) => {
    log.error('socket error', e)
    Sentry.captureException(e)
  })

  // The server broadcasts events on a channel named after the token.
  socket.on(token, (...args: unknown[]) => {
    const message = args[0] as SignedMessage
    if (
      safeVerify(message) &&
      message.holdfor === holdFor &&
      !seenSignatures.has(message.signature)
    ) {
      seenSignatures.add(message.signature)
      handleAction(message.action)
    } else {
      Sentry.captureMessage('Message signature mismatch.')
    }
  })
}

export function stopListening(): void {
  if (socket) {
    socket.close()
    socket = undefined
  }
  seenSignatures = new Set<string>()
}

function safeVerify(message: SignedMessage): boolean {
  try {
    return verifyMessage(message)
  } catch (e) {
    Sentry.captureException(e)
    return false
  }
}

function handleAction(action: SlideAction): void {
  switch (action) {
    case SLIDE_UP:
    case PLAY_MEDIA:
      keys.rightArrow().catch(reportKeyError)
      break
    case SLIDE_DOWN:
      keys.leftArrow().catch(reportKeyError)
      break
    default:
      break
  }
}

function reportKeyError(e: unknown): void {
  log.error('failed to send key', e)
  Sentry.captureException(e)
}
