import type { JSX, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'

export interface CameraConfig {
    position: [number, number, number]
    fov: number
}

export interface SimulationCanvasProps {
    camera?: CameraConfig
    children: ReactNode
    className?: string
}

export const CAMERA_CONFIG: CameraConfig = {
    position: [0, 400, 0],
    fov: 30,
}

export default function SimulationCanvas({
    camera = CAMERA_CONFIG,
    children,
    className = 'no-drag',
}: SimulationCanvasProps): JSX.Element {
    return (
        <Canvas
            camera={{
                position: camera.position,
                fov: camera.fov,
            }}
            style={{ display: 'block', userSelect: 'none' }}
            className={className}
        >
            {children}
        </Canvas>
    )
}
