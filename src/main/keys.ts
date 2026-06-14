import SendKeys from 'send-keys-native'

export function leftArrow(): Promise<void> {
  return SendKeys.leftArrow()
}

export function rightArrow(): Promise<void> {
  return SendKeys.rightArrow()
}

export function hasPermissions(): Promise<boolean> {
  return SendKeys.hasPermissions()
}
