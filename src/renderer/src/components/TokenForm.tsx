import { useEffect, useRef } from 'react'
import styles from './TokenForm.module.css'

interface TokenFormProps {
  token: string
  onChange: (index: number, value: string) => void
}

export function TokenForm({ token, onChange }: TokenFormProps): React.JSX.Element {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const currentValue = (index: number): string => (token[index] === '_' ? '' : token[index])

  const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target
    const numberVal = Number.parseInt(value, 10)

    if (!Number.isNaN(numberVal) && numberVal < 10) {
      const next = index + 1
      if (next < inputs.current.length) {
        inputs.current[next]?.focus()
        inputs.current[next]?.select()
      }
      onChange(index, value)
    } else if (value === '') {
      const prev = index - 1
      if (prev >= 0) {
        inputs.current[prev]?.focus()
        inputs.current[prev]?.select()
      }
      onChange(index, value)
    }
  }

  return (
    <div className={styles.tokenForm}>
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          ref={el => {
            inputs.current[index] = el
          }}
          value={currentValue(index)}
          onChange={handleChange(index)}
        />
      ))}
    </div>
  )
}
