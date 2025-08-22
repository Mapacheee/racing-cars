import { Physics, RigidBody, interactionGroups } from '@react-three/rapier'
import { OrbitControls } from '@react-three/drei'
import type { ReactNode } from 'react'
import type { Track, TrackViewSettings } from '../types/index'
import Track3D from './Track3D'
import TrackWalls from './TrackWalls'
import TrackWaypoints from './TrackWaypoints'

interface TrackSceneProps {
    track: Track
    settings: TrackViewSettings
    highlightedWaypoint?: number
    children?: ReactNode
    enablePhysics?: boolean
    enableControls?: boolean
}

export default function TrackScene({
    track,
    settings,
    highlightedWaypoint = -1,
    children,
    enablePhysics = true,
    enableControls = true,
}: TrackSceneProps) {
    const sceneContent = (
        <>
            {/* lighting setup */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 7]} intensity={1} />

            {/* ground plane with or without physics */}
            {enablePhysics ? (
                <RigidBody
                    type="fixed"
                    colliders="cuboid"
                    restitution={0}
                    friction={10.0} // Maximum friction to stop cars from leaving the map
                    collisionGroups={interactionGroups(2, [1])}
                    solverGroups={interactionGroups(2, [1])}
                >
                    <mesh position={[0, -0.8, 0]} receiveShadow>
                        <boxGeometry args={[200, 0.2, 200]} />
                        <meshStandardMaterial color="lightgreen" />
                    </mesh>
                </RigidBody>
            ) : (
                <mesh position={[0, -0.8, 0]} receiveShadow>
                    <boxGeometry args={[200, 0.2, 200]} />
                    <meshStandardMaterial color="lightgreen" />
                </mesh>
            )}

            {/* track components */}
            <Track3D
                pieces={track.pieces}
                visible={settings.showTrack}
                enablePhysics={enablePhysics}
            />
            <TrackWalls
                walls={track.walls}
                visible={settings.showWalls}
                enablePhysics={true}
            />
            <TrackWaypoints
                waypoints={track.waypoints}
                visible={settings.showWaypoints}
                highlightedIndex={highlightedWaypoint}
            />

            {/* custom children (cars, UI, etc) */}
            {children}

            {/* camera controls */}
            {enableControls && (
                <OrbitControls enablePan enableZoom enableRotate />
            )}
        </>
    )

    if (enablePhysics) {
        return (
            <Physics gravity={[0, -9.81, 0]} paused={false}>
                {sceneContent}
            </Physics>
        )
    }

    return <>{sceneContent}</>
}
