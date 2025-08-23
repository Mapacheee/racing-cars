import type { JSX } from 'react'
import type { TrackPiece, Track } from '../types/index'
import { ROAD_GEOMETRY } from '../systems/TrackSystem'
import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Track3DProps {
    pieces: TrackPiece[]
    track?: Track
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

function TrackCenterline({ track }: { track: Track }): JSX.Element | null {
    const lineRef = useRef<THREE.Line>(null)

    const centerlineGeometry = useMemo(() => {
        if (
            !track.splineData?.centralPath ||
            track.splineData.centralPath.length < 2
        ) {
            return null
        }

        const points: THREE.Vector3[] = []
        const centralPath = track.splineData.centralPath

        for (let i = 0; i < centralPath.length; i++) {
            const point = centralPath[i]
            points.push(
                new THREE.Vector3(point.x, ROAD_GEOMETRY.height - 0.9, point.y)
            )
        }

        if (points.length > 0) {
            points.push(points[0].clone())
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return geometry
    }, [track.splineData?.centralPath])

    useEffect(() => {
        if (lineRef.current && centerlineGeometry) {
            lineRef.current.computeLineDistances()
        }
    }, [centerlineGeometry])

    if (!centerlineGeometry) {
        return null
    }

    return (
        // @ts-ignore - React Three Fiber line component
        <line ref={lineRef}>
            <primitive object={centerlineGeometry} />
            <lineDashedMaterial
                color="#ffffff"
                dashSize={1.5}
                gapSize={1.0}
                linewidth={3}
                transparent={true}
                opacity={0.9}
            />
        </line>
    )
}

export default function Track3D({
    pieces,
    track,
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
            {track && <TrackCenterline track={track} />}
        </>
    )
}
