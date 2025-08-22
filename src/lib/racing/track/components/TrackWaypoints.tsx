import { Text, useGLTF } from '@react-three/drei'
import type { Waypoint } from '../types/index'

useGLTF.preload('/assets/models/overhead.glb')

interface TrackWaypointsProps {
    waypoints: Waypoint[]
    visible?: boolean
    highlightedIndex?: number
    startPointColor?: string
    waypointColor?: string
    highlightColor?: string
}

export default function TrackWaypoints({
    waypoints,
    visible = true,
    highlightedIndex = -1,
    startPointColor = 'green',
    waypointColor = 'red',
    highlightColor = 'cyan',
}: TrackWaypointsProps) {
    if (!visible) return <></>

    return (
        <>
            {waypoints.map((waypoint, index) => {
                const nextIndex = (index + 1) % waypoints.length
                const nextWaypoint = waypoints[nextIndex]
                const isStartPoint = index === 0
                const isHighlighted = highlightedIndex === index

                const getWaypointColor = () => {
                    if (isStartPoint) return startPointColor
                    if (isHighlighted) return highlightColor
                    return waypointColor
                }

                return (
                    <group key={`waypoint-${index}`}>
                        {/* waypoint sphere marker */}
                        <mesh position={[waypoint.x, 0.3, waypoint.z]}>
                            <sphereGeometry args={[isStartPoint ? 0.4 : 0.3]} />
                            <meshStandardMaterial
                                color={getWaypointColor()}
                                opacity={isHighlighted ? 1 : 1}
                            />
                        </mesh>

                        {/* waypoint number label for start point only */}
                        {isStartPoint && (
                            <Text
                                position={[waypoint.x, 0.8, waypoint.z]}
                                fontSize={0.5}
                                color="white"
                                anchorX="center"
                                anchorY="middle"
                                rotation={[-Math.PI / 2, 0, 0]}
                            >
                                START
                            </Text>
                        )}

                        {/* connection line to next waypoint */}
                        <mesh
                            position={[
                                (waypoint.x + nextWaypoint.x) / 2,
                                0.05,
                                (waypoint.z + nextWaypoint.z) / 2,
                            ]}
                            rotation={[
                                0,
                                Math.atan2(
                                    nextWaypoint.x - waypoint.x,
                                    nextWaypoint.z - waypoint.z
                                ),
                                0,
                            ]}
                        >
                            <boxGeometry
                                args={[
                                    0.5,
                                    0.1,
                                    Math.sqrt(
                                        (nextWaypoint.x - waypoint.x) ** 2 +
                                            (nextWaypoint.z - waypoint.z) ** 2
                                    ),
                                ]}
                            />
                            <meshStandardMaterial
                                color="gray"
                                transparent
                                opacity={0.6}
                            />
                        </mesh>
                    </group>
                )
            })}
        </>
    )
}
