import React from 'react'
import ReactDOM from 'react-dom/client'
import { Options } from './Options'
import './index.css'

import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <Toaster position="top-center" reverseOrder={false} />
    <Options />
  </React.StrictMode>,
)
