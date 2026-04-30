import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Initialize theme before React mounts to prevent flash
const stored = localStorage.getItem('pixel-forge-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const initialTheme = stored === 'light' ? 'light' : stored === 'dark' ? 'dark' : prefersDark ? 'dark' : 'light'
if (initialTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)