import { RigidBody, interactionGroups } from '@react-three/rapier'
import { CuboidCollider } from '@react-three/rapier'
import type { Wall } from '../types/index'
import React from 'react'

interface TrackWallsProps {
    walls: Wall[]
    visible?: boolean
    showColors?: boolean
    enablePhysics?: boolean
}

function groupStraightWalls(walls: Wall[]): Wall[] {
    if (walls.length === 0) return [];
    const grouped: Wall[] = [];
    let current = { ...walls[0] };
    for (let i = 1; i < walls.length; i++) {
        const prev = current;
        const next = walls[i];
        const dx1 = prev.end.x - prev.start.x;
        const dz1 = prev.end.z - prev.start.z;
        const dx2 = next.end.x - next.start.x;
        const dz2 = next.end.z - next.start.z;
        const sameDirection = Math.abs(dx1 * dz2 - dz1 * dx2) < 0.0001;
        const sameSide = prev.side === next.side;
        if (sameDirection && sameSide &&
            (prev.end.x === next.start.x && prev.end.z === next.start.z)) {
            current = {
                start: { ...prev.start },
                end: { ...next.end },
                side: prev.side,
            };
        } else {
            grouped.push(current);
            current = { ...next };
        }
    }
    grouped.push(current);
    return grouped;
}


// track boundary walls component with optional collision physics
export default function TrackWalls({
    walls,
    visible = true,
    showColors = true,
    enablePhysics = true,
}: TrackWallsProps) {
    const groupedWalls = groupStraightWalls(walls);
    return (
        <RigidBody
            type="fixed"
            colliders={false}
            userData={{ type: 'wall' }}
            restitution={0.1}
            friction={2.0}
            collisionGroups={interactionGroups(2, [1])}
            solverGroups={interactionGroups(2, [1])}
        >
            {groupedWalls.map((wall, index) => {
                const centerX = (wall.start.x + wall.end.x) / 2;
                const centerZ = (wall.start.z + wall.end.z) / 2;
                const dx = wall.end.x - wall.start.x;
                const dz = wall.end.z - wall.start.z;
                const length = Math.sqrt(dx * dx + dz * dz);
                const rotation = Math.atan2(dx, dz);
                return (
                    <React.Fragment key={`wall-fragment-${index}`}>
                        <mesh
                            position={[centerX, 0.25, centerZ]}
                            rotation={[0, rotation, 0]}
                            userData={{ type: 'wall', side: wall.side }}
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
                        <CuboidCollider
                            position={[centerX, 0.25, centerZ]}
                            rotation={[0, rotation, 0]}
                            args={[0.25, 1.5, length / 2]}
                            restitution={0.1}
                            friction={2.0}
                        />
                    </React.Fragment>
                );
            })}
        </RigidBody>
    );
}
