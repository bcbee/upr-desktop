export type SlideAction = 'SlideUp' | 'SlideDown' | 'PlayMedia'

/** A signed presentation event received from the server over Socket.IO. */
export interface SignedMessage {
  action: SlideAction
  holdfor: string
  signature: string
  timestamp: string
}

/** The API exposed to the renderer via the preload `contextBridge` as `window.upr`. */
export interface UprApi {
  /** Host platform reported by the main process (e.g. 'darwin', 'win32'). */
  platform: string
  /** Validate a 6-digit token; resolves the session holdFor (> 0 success, <= 0 invalid). */
  joinSession(token: string): Promise<number>
  /** Begin listening for presentation events for this token + holdFor. */
  startListening(token: string, holdFor: string): Promise<void>
  /** Stop listening and disconnect from the server. */
  stopListening(): Promise<void>
  /** Probe whether the OS will let us send keystrokes (macOS Automation permission). */
  hasPermissions(): Promise<boolean>
  /** Show a native error dialog. */
  showError(title: string, message: string): Promise<void>
  /** Open a URL in the user's default browser. */
  openExternal(url: string): Promise<void>
}
