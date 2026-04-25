import { createRoot } from 'react-dom/client'
import { App } from './App'
import './style.css'

const container = document.getElementById('app')
if (!container) throw new Error('Failed to find the root element')

const root = createRoot(container)
root.render(<App />)

// Register service worker for PWA (production only)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service Worker registration failed:', error)
    })
  })
}
