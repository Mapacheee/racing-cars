import { useContext } from 'react'
import { CanvasSettingsContext } from './CanvasSettings'
import type { CanvasSettings } from './CanvasSettings'

export function useCanvasSettings(): CanvasSettings {
    const context = useContext(CanvasSettingsContext)
    if (context === undefined) {
        throw new Error('useCanvasSettings debe ser usado con CanvasSettingsProvider')
    }
    return context
}
