import { useState } from 'react'
import { TRACKS } from '../../../lib/racing/track'
import type { Track } from '../../../lib/racing/track/types'
import CanvasSettingsMenu from './components/CanvasSettingsMenu'
import SimulationCanvas from './components/SimulationCanvas'
import LoadingScreen from './components/LoadingScreen'
import { RaceResetProvider } from '../../../lib/contexts/RaceResetContext'

export default function TrainingSimulation() {
    const [track, setTrack] = useState<Track>(
        () => TRACKS['current'] || TRACKS['main_circuit']
    )
    const [isLoading] = useState(false)

    if (isLoading) {
        return <LoadingScreen message="Loading training simulation..." />
    }

    return (
        <RaceResetProvider>
            <div className="fixed inset-0 w-screen h-screen bg-cyan-200 z-50">
                <CanvasSettingsMenu setTrack={setTrack} />
                <SimulationCanvas track={track} />
            </div>
        </RaceResetProvider>
    )
}
