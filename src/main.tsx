import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initOneSignal } from './lib/onesignal'

// Fire-and-forget: subscribes the user for push and tags them role="public".
initOneSignal()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
