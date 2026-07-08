'use strict'

const { spawnSync } = require('node:child_process')
const path = require('node:path')

if (process.platform !== 'win32') {
  process.exit(0)
}

const rootDir = path.resolve(__dirname, '..')
const nativeDir = path.join(rootDir, 'native', 'win-keysender')
const nodeGyp = path.join(rootDir, 'node_modules', 'node-gyp', 'bin', 'node-gyp.js')
const result = spawnSync(process.execPath, [nodeGyp, 'rebuild'], {
  cwd: nativeDir,
  stdio: 'inherit'
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
