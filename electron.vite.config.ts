import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// The transitional "1.3.2" bridge build sets UPR_MIGRATION_NOTICE=true so the app
// prompts macOS users to download the signed build. Signed 2.0.0+ builds leave it unset.
const migrationNotice = process.env.UPR_MIGRATION_NOTICE === 'true'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    define: {
      __UPR_MIGRATION_NOTICE__: JSON.stringify(migrationNotice)
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') }
      }
    }
  }
})
