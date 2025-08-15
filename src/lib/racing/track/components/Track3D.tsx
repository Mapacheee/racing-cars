import { useGLTF } from '@react-three/drei'
import { RigidBody, interactionGroups } from '@react-three/rapier'
import type { JSX } from 'react'
import type { TrackPiece } from '../types/index'
import { ROAD_GEOMETRY } from '../systems/TrackSystem'

interface Track3DProps {
    pieces: TrackPiece[]
    visible?: boolean
    enablePhysics?: boolean
}

// individual track piece component with optional physics collision
function TrackPieceComponent({
    piece,
    enablePhysics = true,
}: {
    piece: TrackPiece
    enablePhysics?: boolean
}): JSX.Element {
    if (piece.model === 'road_segment') {
        return (
            <mesh position={piece.position} rotation={piece.rotation}>
                <boxGeometry
                    args={[
                        ROAD_GEOMETRY.width,
                        ROAD_GEOMETRY.height,
                        ROAD_GEOMETRY.length,
                    ]}
                />
                <meshStandardMaterial color="#444444" />
            </mesh>
        )
    }

    // for custom 3d models (future expansion)
    const { scene } = useGLTF(`/assets/models/${piece.model}`)
    const modelPrimitive = (
        <primitive
            object={scene.clone()}
            position={piece.position}
            rotation={piece.rotation}
            scale={1}
        />
    )

    return enablePhysics ? (
        <RigidBody type="fixed" colliders="trimesh">
            {modelPrimitive}
        </RigidBody>
    ) : (
        modelPrimitive
    )
}

// main track 3d component - renders all track pieces with optional physics
export default function Track3D({
    pieces,
    visible = true,
    enablePhysics = true,
}: Track3DProps): JSX.Element {
    if (!visible) return <></>

    return (
        <>
            {pieces.map((piece, index) => (
                <TrackPieceComponent
                    key={`track-piece-${index}`}
                    piece={piece}
                    enablePhysics={enablePhysics}
                />
            ))}
        </>
    )
}
