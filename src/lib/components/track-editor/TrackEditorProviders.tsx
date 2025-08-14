import type { JSX, ReactNode } from 'react'
import { RaceResetProvider } from '../../contexts/RaceResetContext'

interface TrackEditorProvidersProps {
    children: ReactNode
}

export default function TrackEditorProviders({
    children,
}: TrackEditorProvidersProps): JSX.Element {
    return <RaceResetProvider>{children}</RaceResetProvider>
}
