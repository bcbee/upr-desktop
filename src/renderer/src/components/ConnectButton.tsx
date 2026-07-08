import { Button } from './Button'

interface ConnectButtonProps {
  token: string
  onConnected: (holdFor: string) => void
  onResetToken: () => void
}

export function ConnectButton({
  token,
  onConnected,
  onResetToken
}: ConnectButtonProps): React.JSX.Element {
  const incomplete = token.includes('_')

  const joinSession = async (): Promise<void> => {
    let data: number
    try {
      data = await window.upr.joinSession(token)
    } catch (e) {
      await window.upr.showError(
        'Whoops!',
        `There was an error connecting to UPR - (${(e as Error).message})`
      )
      return
    }

    if (data > 0) {
      onConnected(String(data))
    } else {
      await window.upr.showError('Whoops!', 'The token you entered does not appear to be valid.')
      onResetToken()
    }
  }

  return (
    <Button
      active={!incomplete}
      title={incomplete ? 'Enter a token...' : 'Start Presenting'}
      onClick={joinSession}
    />
  )
}
