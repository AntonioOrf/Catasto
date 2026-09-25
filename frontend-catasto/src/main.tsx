import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Providers } from './providers/Providers'
// Source Serif 4 ospitato in locale (CSP font-src 'self'): assi di peso e
// ottico, così lo stesso carattere resta leggibile dai titoli alle etichette.
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
)
