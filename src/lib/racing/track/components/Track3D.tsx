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
