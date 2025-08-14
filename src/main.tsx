import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CanvasSettingsProvider } from './lib/contexts/CanvasSettings.tsx'
import { AuthProvider } from './lib/contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <CanvasSettingsProvider>
                <App />
            </CanvasSettingsProvider>
        </AuthProvider>
    </StrictMode>
)
