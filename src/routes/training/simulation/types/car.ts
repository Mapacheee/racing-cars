import type { Genome } from './neat'

export interface AICar {
    id: string
    position: [number, number, number]
    rotation?: number
    color?: string
    trackId?: string
    genome?: Genome
}

export interface CarPhysicsConfig {
    angularDamping: number
    linearDamping: number
    spawnHeight: number
}

export interface CarCollisionGroups {
    cars: number
    walls: number
    track: number
}
