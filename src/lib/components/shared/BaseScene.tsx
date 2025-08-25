import { Suspense, type ReactNode } from 'react'
import type { Track, TrackViewSettings } from '../../racing/track/types'
import { TrackScene } from '../../racing/track'

export interface BaseSceneProps {
    track: Track
    settings?: TrackViewSettings
    children?: ReactNode
    enablePhysics?: boolean
    enableControls?: boolean
    highlightedWaypoint?: number
}

const DEFAULT_TRACK_SETTINGS: TrackViewSettings = {
    showWaypoints: false,
    showWalls: true,
    showTrack: true,
}

export default function BaseScene({
    track,
    settings = DEFAULT_TRACK_SETTINGS,
    children,
    enablePhysics = true,
    enableControls = true,
    highlightedWaypoint = -1,
}: BaseSceneProps) {
    return (
        <TrackScene
            track={track}
            settings={settings}
            highlightedWaypoint={highlightedWaypoint}
            enablePhysics={enablePhysics}
            enableControls={enableControls}
        >
            <Suspense fallback={null}>{children}</Suspense>
        </TrackScene>
    )
}
