import type { JSX } from 'react'
import type { Track } from '../../../../lib/racing/track/types'
import { SimulationCanvas as BaseSimulationCanvas } from '../../../../lib/components/shared'
import CarScene from '../scene/CarScene'

export default function SimulationCanvas({
    track,
}: {
    track: Track
}): JSX.Element {
    return (
        <BaseSimulationCanvas>
            <CarScene track={track} />
        </BaseSimulationCanvas>
    )
}
