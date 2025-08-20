import type { JSX } from 'react'
import type { Track } from '../../../../lib/racing/track/types'
import { Canvas } from '@react-three/fiber'
import { CAMERA_CONFIG } from '../config/rendering'
import CarScene from '../scene/CarScene'

export default function SimulationCanvas({ track }: { track: Track }): JSX.Element {
    return (
        <Canvas
            camera={{ 
                position: CAMERA_CONFIG.position, 
                fov: CAMERA_CONFIG.fov 
            }}
            style={{ display: 'block', userSelect: 'none' }}
            className="no-drag"
        >
            <CarScene track={track} />
        </Canvas>
    )
}
