import styles from './NavBar.module.css'
import { BackIcon, CloseIcon } from './icons'

interface NavBarProps {
  title?: string
  hasBackButton?: boolean
  hasCloseButton?: boolean
  onBack?: () => void
  onClose?: () => void
}

export function NavBar({
  title = '',
  hasBackButton = false,
  hasCloseButton = false,
  onBack,
  onClose
}: NavBarProps): React.JSX.Element {
  return (
    <div className={styles.navBar}>
      {hasBackButton && (
        <div className={styles.backButton}>
          <button type="button" onClick={onBack}>
            <BackIcon />
            <span>Back</span>
          </button>
        </div>
      )}
      {hasCloseButton && (
        <div className={styles.closeButton}>
          <button type="button" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      )}
      <p>{title}</p>
    </div>
  )
}
