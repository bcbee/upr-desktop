import styles from './Button.module.css'

interface ButtonProps {
  active: boolean
  title: string
  onClick: () => void
}

export function Button({ active, title, onClick }: ButtonProps): React.JSX.Element {
  const className = [styles.button]
  if (active) className.push(styles.active)

  return (
    <div className={className.join(' ')}>
      <button
        type="button"
        onClick={() => {
          if (active) onClick()
        }}
      >
        {title}
      </button>
    </div>
  )
}
