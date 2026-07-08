import { app } from 'electron'
import log from 'electron-log/main'

const SERVER_URL = 'https://universalpresenterremote.com'

/**
 * Validate a token with the server. Returns the session holdFor as a number
 * (> 0 on success, <= 0 when the token is invalid). The endpoint replies with
 * plain text, mirroring the original axios-based client.
 */
export async function joinSession(token: string): Promise<number> {
  const url = `${SERVER_URL}/JoinSession?token=${encodeURIComponent(token)}`
  const res = await fetch(url, {
    headers: {
      upr_version: app.getVersion(),
      upr_platform: process.platform
    }
  })
  if (!res.ok) {
    log.warn(`joinSession(${token}) failed with HTTP ${res.status}`)
    throw new Error(`HTTP ${res.status} ${res.statusText}`.trim())
  }

  const text = (await res.text()).trim()
  const value = Number.parseInt(text, 10)
  log.info(`joinSession(${token}) -> "${text}"`)
  return Number.isNaN(value) ? 0 : value
}
