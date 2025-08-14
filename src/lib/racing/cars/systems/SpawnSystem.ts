import type { Track } from '../../track'
import type { BaseCar } from '../types'

// spawn configuration for car generation
export interface SpawnConfig {
    trackId: string
    carCount: number
    colors: string[]
    startOffset?: number
    formation?: 'single' | 'grid' | 'random'
}

// calculate spawn position and orientation from track data
export function calculateSpawnTransform(track: Track): {
    position: [number, number, number]
    rotation: number
} {
    const firstWaypoint = track.waypoints[0]
    const secondWaypoint = track.waypoints[1]

    const position: [number, number, number] = [
        firstWaypoint.x + 0.5,
        0,
        firstWaypoint.z - 1,
    ]

    // calculate rotation towards second waypoint for proper direction
    const dx = secondWaypoint.x - firstWaypoint.x
    const dz = secondWaypoint.z - firstWaypoint.z
    const rotation = Math.atan2(dx, dz)

    return { position, rotation }
}

// generate basic car spawn data
export function generateBaseCars(config: SpawnConfig, track: Track): BaseCar[] {
    const { position, rotation } = calculateSpawnTransform(track)
    const cars: BaseCar[] = []

    for (let i = 0; i < config.carCount; i++) {
        // calculate spawn position with formation pattern
        const spawnPosition = calculateFormationPosition(
            position,
            i,
            config.formation || 'single'
        )

        const car: BaseCar = {
            id: `car-${i + 1}`,
            position: spawnPosition,
            rotation,
            color: config.colors[i % config.colors.length] || '#ff0000',
            trackId: config.trackId,
        }

        cars.push(car)
    }

    return cars
}

// calculate spawn position based on formation pattern
function calculateFormationPosition(
    basePosition: [number, number, number],
    index: number,
    formation: 'single' | 'grid' | 'random'
): [number, number, number] {
    switch (formation) {
        case 'grid':
            const gridSize = Math.ceil(Math.sqrt(index + 1))
            const row = Math.floor(index / gridSize)
            const col = index % gridSize
            return [
                basePosition[0] + (col - gridSize / 2) * 2,
                basePosition[1],
                basePosition[2] - row * 3,
            ]

        case 'random':
            return [
                basePosition[0] + (Math.random() - 0.5) * 10,
                basePosition[1],
                basePosition[2] + (Math.random() - 0.5) * 5,
            ]

        case 'single':
        default:
            // all cars spawn at same position (ghost mode for AI training)
            return basePosition
    }
}

// generate colors for cars if not provided
export function generateCarColors(count: number): string[] {
    const baseColors = [
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#ffff00',
        '#ff00ff',
        '#00ffff',
        '#ffa500',
        '#800080',
        '#008000',
        '#000080',
    ]

    const colors: string[] = []
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length])
    }

    return colors
}

// validate spawn configuration
export function validateSpawnConfig(config: SpawnConfig): boolean {
    return (
        config.carCount > 0 &&
        config.trackId.length > 0 &&
        config.colors.length > 0
    )
}
