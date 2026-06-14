import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/electron/renderer'
import { App } from './App'
import './styles/global.css'

Sentry.init({})

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
createRoot(container).render(<App />)
