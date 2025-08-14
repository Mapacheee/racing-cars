import type { JSX } from 'react'
import { useEffect } from 'react'
import {
    TrackEditorCanvas,
    TrackEditorProviders,
} from '../../../lib/components/track-editor'
import { CanvasSettingsProvider } from '../../../lib/contexts/CanvasSettings'

export default function TrackEditor(): JSX.Element {
    useEffect(() => {
        document.title = 'Editor de Pista - Administración 🏎️🛠️'
    }, [])

    return (
        <CanvasSettingsProvider>
            <TrackEditorProviders>
                <div className="fixed inset-0 w-screen h-screen bg-cyan-200 z-50">
                    <TrackEditorCanvas />
                </div>
            </TrackEditorProviders>
        </CanvasSettingsProvider>
    )
}
