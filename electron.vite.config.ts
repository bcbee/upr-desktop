import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// The transitional "1.3.2" bridge build runs with `--mode bridge` (npm run
// build:bridge) so the app prompts macOS users to download the signed build.
// Signed 2.0.0+ builds use the default mode. A CLI mode flag (rather than an
// env var) keeps the script portable across POSIX shells and Windows.
export default defineConfig(({ mode }) => {
  const migrationNotice = mode === 'bridge'

  return {
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
  }
})
