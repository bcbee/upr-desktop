import { useState, type ReactNode } from 'react'
import styles from './Modal.module.css'
import { NavBar } from './NavBar'
import { Button } from './Button'

interface ModalProps {
  title: string
  children: ReactNode
  buttonTitle: string
  buttonOnClick: () => void
  buttonActive: boolean
  canClose?: boolean
}

export function Modal({
  title,
  children,
  buttonTitle,
  buttonOnClick,
  buttonActive,
  canClose
}: ModalProps): React.JSX.Element | null {
  const [open, setOpen] = useState(true)
  if (!open) return null

  return (
    <div className={styles.container}>
      <NavBar title={title} hasCloseButton={canClose} onClose={() => setOpen(false)} />
      <div className={styles.bodyContainer}>{children}</div>
      <Button title={buttonTitle} onClick={buttonOnClick} active={buttonActive} />
    </div>
  )
}
