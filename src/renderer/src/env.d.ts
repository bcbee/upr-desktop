/// <reference types="vite/client" />
import type { UprApi } from '../../shared/types'

declare global {
  interface Window {
    upr: UprApi
  }
  /** Build-time flag: true in the unsigned 1.3.3 bridge build (shows the macOS download notice). */
  const __UPR_MIGRATION_NOTICE__: boolean
}

export {}
