'use strict'

const { existsSync } = require('node:fs')
const path = require('node:path')

async function verifyNativeDeps(context) {
  if (context.electronPlatformName !== 'win32') {
    return
  }

  const modulePath = path.join(
    context.appOutDir,
    'resources',
    'app.asar.unpacked',
    'node_modules',
    'send-keys-native-windows'
  )
  const requiredFiles = [
    path.join(modulePath, 'index.js'),
    path.join(modulePath, 'build', 'Release', 'binding.node')
  ]
  const missingFiles = requiredFiles.filter(filePath => !existsSync(filePath))

  if (missingFiles.length > 0) {
    throw new Error(
      `send-keys-native-windows was not packaged correctly. Missing: ${missingFiles.join(', ')}`
    )
  }
}

module.exports = verifyNativeDeps
module.exports.default = verifyNativeDeps
