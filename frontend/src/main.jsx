import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import I18nProvider from './I18nProvider.jsx'
import { AIProvider } from './ai/AIContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
)
