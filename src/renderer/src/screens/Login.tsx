import { useEffect, useState } from 'react'
import styles from './Login.module.css'
import { TokenForm } from '../components/TokenForm'
import { ConnectButton } from '../components/ConnectButton'
import { Modal } from '../components/Modal'
import Logo from '../assets/icon.png'
import Banner from '../assets/banner.png'

interface LoginProps {
  token: string
  onUpdateToken: (index: number, value: string) => void
  onConnected: (holdFor: string) => void
  onResetToken: () => void
}

export function Login({
  token,
  onUpdateToken,
  onConnected,
  onResetToken
}: LoginProps): React.JSX.Element {
  const [hasPermissions, setHasPermissions] = useState(true)

  const checkPermissions = async (): Promise<boolean> => {
    try {
      const granted = await window.upr.hasPermissions()
      setHasPermissions(granted)
      return granted
    } catch {
      setHasPermissions(false)
      return false
    }
  }

  useEffect(() => {
    void checkPermissions()
  }, [])

  return (
    <div className={styles.container}>
      <img src={Logo} alt="Logo" className={styles.logo} />
      <br />
      <img src={Banner} alt="Banner" className={styles.banner} />
      <h2>Universal Presenter Remote</h2>
      <TokenForm token={token} onChange={onUpdateToken} />
      <ConnectButton token={token} onConnected={onConnected} onResetToken={onResetToken} />

      {!hasPermissions && (
        <Modal
          title="Welcome to UPR"
          buttonTitle="Check Permissions"
          buttonActive
          buttonOnClick={async () => {
            const granted = await checkPermissions()
            if (!granted) {
              await window.upr.showError(
                'Whoops!',
                'UPR is still missing the required permissions. Please try again, or restart UPR Desktop.'
              )
            }
          }}
        >
          <div>
            <h1>Review Permissions</h1>
            <p>
              In order for UPR to control your presentations, it needs permission to an application
              called System Events.
            </p>
            <p>
              To allow this, open System Settings then select Privacy &amp; Security. Make sure UPR
              is checked in both the Automation and Accessibility sections.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
