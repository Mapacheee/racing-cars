import { RigidBody, interactionGroups } from '@react-three/rapier'
import type { Wall } from '../types/index'

interface TrackWallsProps {
    walls: Wall[]
    visible?: boolean
    showColors?: boolean
    enablePhysics?: boolean
}

// track boundary walls component with optional collision physics
export default function TrackWalls({
    walls,
    visible = true,
    showColors = true,
    enablePhysics = true,
}: TrackWallsProps) {
    return (
        <>
            {walls.map((wall, index) => {
                const centerX = (wall.start.x + wall.end.x) / 2
                const centerZ = (wall.start.z + wall.end.z) / 2
                const dx = wall.end.x - wall.start.x
                const dz = wall.end.z - wall.start.z
                const length = Math.sqrt(dx * dx + dz * dz)
                const rotation = Math.atan2(dx, dz)

                const wallMesh = (
                    <mesh
                        position={[centerX, 0.25, centerZ]}
                        rotation={[0, rotation, 0]}
                    >
                        <boxGeometry args={[0.5, 3, length]} />
                        <meshBasicMaterial
                            color={
                                showColors
                                    ? wall.side === 'left'
                                        ? 'red'
                                        : 'blue'
                                    : 'gray'
                            }
                            transparent
                            opacity={visible ? 0.7 : 0.0}
                        />
                    </mesh>
                )

                return (
                    <RigidBody
                        key={`wall-${index}`}
                        type="fixed"
                        colliders="cuboid"
                        userData={{ type: 'wall', side: wall.side }}
                        restitution={0.1}
                        friction={2.0}
                        collisionGroups={interactionGroups(2, [1])}
                        solverGroups={interactionGroups(2, [1])}
                    >
                        {wallMesh}
                    </RigidBody>
                )
            })}
        </>
    )
}
