import type { JSX } from 'react'
import type { TrackPiece } from '../types/index'
import { ROAD_GEOMETRY } from '../systems/TrackSystem'

interface Track3DProps {
    pieces: TrackPiece[]
    visible?: boolean
    enablePhysics?: boolean
}

function TrackPieceComponent({
    piece,
    enablePhysics: _enablePhysics = true,
}: {
    piece: TrackPiece
    enablePhysics?: boolean
}): JSX.Element {
    const adjustedPosition: [number, number, number] = [
        piece.position[0],
        ROAD_GEOMETRY.height - 1.12,
        piece.position[2],
    ]
    return (
        <mesh position={adjustedPosition} rotation={piece.rotation}>
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
