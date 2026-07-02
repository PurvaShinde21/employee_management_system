import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const renderApp = () => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Load mock backend if running in Demo Mode (e.g., GitHub Pages)
if (import.meta.env.VITE_DEMO_MODE === 'true') {
  import('./mockBackend.js').then(() => {
    console.log('🧪 Running in Demo Mode with Mock Backend');
    renderApp();
  });
} else {
  renderApp();
}
