import type { JSX } from 'react'
import { Canvas } from '@react-three/fiber'
import { TrackEditorScene } from '.'

const CAMERA_CONFIG = {
    position: [0, 80, 120] as const,
    fov: 30,
}

export default function TrackEditorCanvas(): JSX.Element {
    return (
        <Canvas
            camera={{
                position: CAMERA_CONFIG.position,
                fov: CAMERA_CONFIG.fov,
            }}
            style={{ display: 'block', userSelect: 'none' }}
            className="no-drag"
        >
            <TrackEditorScene />
        </Canvas>
    )
}
