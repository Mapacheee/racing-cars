import { useState, useEffect } from 'react'
import type { JSX } from 'react'
import { TrackScene } from '../../racing/track'
import { TRACKS } from '../../racing/track'
import { useCanvasSettings } from '../../contexts/useCanvasSettings'
import { useRaceReset } from '../../contexts/RaceResetContext'

export default function TrackEditorScene(): JSX.Element {
    const { showWaypoints, showWalls } = useCanvasSettings()
    const { resetCounter } = useRaceReset()
    const [, forceUpdate] = useState({})

    const currentTrack = 'main_circuit'
    const track = TRACKS[currentTrack]

    // force re-render when reset is triggered
    useEffect(() => {
        forceUpdate({})
    }, [resetCounter])

    return (
        <TrackScene
            track={track}
            settings={{
                showWaypoints,
                showWalls,
                showTrack: true,
            }}
            enablePhysics={false} // No physics needed for track editor
            enableControls={true}
        >
            {/* No cars or AI components - just the track */}
        </TrackScene>
    )
}
