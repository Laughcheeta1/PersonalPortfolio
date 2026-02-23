import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './features/i18n'

createRoot(document.getElementById('root')!).render(
  // Keep providers at the app root so global context is available everywhere.
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
