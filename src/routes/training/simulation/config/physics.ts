import type { CarPhysicsConfig, CarCollisionGroups } from '../types/car'

export const CAR_PHYSICS_CONFIG: CarPhysicsConfig = {
    angularDamping: 5.0, // Higher damping for stable arcade physics
    linearDamping: 0.1, // Lower damping for responsive movement
    spawnHeight: 0.6, // Just above track level (track height is 1.2)
}

export const COLLISION_GROUPS: CarCollisionGroups = {
    cars: 1, // Group 1: Cars
    walls: 2, // Group 2: Walls and ground
    track: 4, // Group 4: Track elements
}

// Rapier configuration with bit masks:
// Cars: collisionGroups=0b0001 (I am bit 1), solverGroups=0b0010 (I collide with bit 2)
// Ground/Walls: collisionGroups=0b0010 (I am bit 2), solverGroups=0b0001 (I collide with bit 1)
// Result: Cars DON'T collide with each other, DO collide with ground/walls

export const GRAVITY = [0, -9.81, 0] as const // Standard gravity for better car stability
