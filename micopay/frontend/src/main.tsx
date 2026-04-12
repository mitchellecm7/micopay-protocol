import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ClaimQR from './pages/ClaimQR'
import './index.css'

// External claim links: /claim/:requestId
// Any AI agent (Claude, GPT, WhatsApp bot...) sends users here to show the QR
const claimMatch = window.location.pathname.match(/^\/claim\/([a-zA-Z0-9_-]+)$/)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {claimMatch ? <ClaimQR requestId={claimMatch[1]} /> : <App />}
  </React.StrictMode>,
)
