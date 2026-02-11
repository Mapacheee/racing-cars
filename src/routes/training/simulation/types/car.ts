import type { Genome } from './neat'

// AI-controlled car with genome
export interface AiCar {
    id: string
    position: [number, number, number]
    rotation?: number
    genome?: Genome
}
export type AICar = AiCar

// Car physics configuration
export interface CarPhysics {
    angularDamping: number
    linearDamping: number
    mass: number
}

// car physics configsfor collision detection
export interface CarPhysicsConfig {
    mass: number
    friction: number
    restitution: number
    density: number
    angularDamping: number
    linearDamping: number
}

// Collision groups for physics
export interface CarCollisionGroups {
    car: number
    wall: number
    sensor: number
}
