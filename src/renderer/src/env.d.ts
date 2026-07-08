/// <reference types="vite/client" />
import type { UprApi } from '../../shared/types'

declare global {
  interface Window {
    upr: UprApi
  }
}

export {}
