import React from 'react'
import ReactDOM from 'react-dom/client'
import { SidePanel } from './SidePanel'

import { Toaster } from 'react-hot-toast'

import './index.css'

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <Toaster position="top-center" reverseOrder={false} />
    <SidePanel />
  </React.StrictMode>,
)
