import { useState } from 'react'
import { Login } from './screens/Login'
import { Present } from './screens/Present'

const EMPTY_TOKEN = '______'

export function App(): React.JSX.Element {
  const [token, setToken] = useState(EMPTY_TOKEN)
  const [holdFor, setHoldFor] = useState('')

  // Replace the digit at `index`, mirroring the original token reducer:
  // non-numeric / out-of-range entries collapse to the '_' placeholder.
  const updateToken = (index: number, value: string): void => {
    setToken(prev => {
      const n = Number.parseInt(value, 10)
      const digit = Number.isNaN(n) || n > 9 ? '_' : value
      const digits = Array.from(prev)
      digits[index] = digit
      let next = ''
      for (let i = 0; i < 6; i += 1) next += digits[i] ? digits[i] : '_'
      return next
    })
  }

  const resetToken = (): void => setToken(EMPTY_TOKEN)

  if (holdFor) {
    return (
      <Present
        token={token}
        holdFor={holdFor}
        onBack={() => {
          setHoldFor('')
          resetToken()
        }}
      />
    )
  }

  return (
    <Login
      token={token}
      onUpdateToken={updateToken}
      onConnected={setHoldFor}
      onResetToken={resetToken}
    />
  )
}
