import type { CarPhysicsConfig, CarCollisionGroups } from '../types/car'

export const CAR_PHYSICS_CONFIG: CarPhysicsConfig = {
    angularDamping: 0.8,
    linearDamping: 0.05,
    spawnHeight: 0.6,
}

export const COLLISION_GROUPS: CarCollisionGroups = {
    cars: 1,
    walls: 2,
    track: 4,
}

// Rapier configuration with bit masks:
// Cars: collisionGroups=0b0001 (I am bit 1), solverGroups=0b0010 (I collide with bit 2)
// Ground/Walls: collisionGroups=0b0010 (I am bit 2), solverGroups=0b0001 (I collide with bit 1)
// Result: Cars DON'T collide with each other, DO collide with ground/walls

export const GRAVITY = [0, -9.81, 0] as const
