import { useEffect } from 'react'
import styles from './Present.module.css'
import { NavBar } from '../components/NavBar'
import Display from '../assets/display.svg'
import Check from '../assets/check.svg'

interface PresentProps {
  token: string
  holdFor: string
  onBack: () => void
}

export function Present({ token, holdFor, onBack }: PresentProps): React.JSX.Element {
  useEffect(() => {
    void window.upr.startListening(token, holdFor)
    return () => {
      void window.upr.stopListening()
    }
  }, [token, holdFor])

  return (
    <div>
      <NavBar title="Present" hasBackButton onBack={onBack} />
      <div className={styles.container}>
        <h2>Ready to Go</h2>
        <h3>Open your presentation and use the app as a remote</h3>
        <div className={styles.statusContainer}>
          <div className={styles.slide}>
            <div>
              <img src={Check} alt="status" />
            </div>
          </div>
          <img src={Display} alt="display" />
        </div>
      </div>
    </div>
  )
}
