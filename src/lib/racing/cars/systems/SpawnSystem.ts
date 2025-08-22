import type { Track } from '../../track'
import type { BaseCar } from '../types'

export interface SpawnConfig {
    trackId: string
    carCount: number
    colors: string[]
    startOffset?: number
    formation?: 'single' | 'grid' | 'random'
}

export function calculateSpawnTransform(track: Track): {
    position: [number, number, number]
    rotation: number
} {
    const firstWaypoint = track.waypoints[0]
    const secondWaypoint = track.waypoints[1]

    const position: [number, number, number] = [
        firstWaypoint.x,
        -0.5,
        firstWaypoint.z,
    ]

    const dx = secondWaypoint.x - firstWaypoint.x
    const dz = secondWaypoint.z - firstWaypoint.z
    const rotation = Math.atan2(dx, dz) + Math.PI / 10

    return { position, rotation }
}

export function generateBaseCars(config: SpawnConfig, track: Track): BaseCar[] {
    const { position, rotation } = calculateSpawnTransform(track)
    const cars: BaseCar[] = []

    for (let i = 0; i < config.carCount; i++) {
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
            return basePosition
    }
}

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

export function validateSpawnConfig(config: SpawnConfig): boolean {
    return (
        config.carCount > 0 &&
        config.trackId.length > 0 &&
        config.colors.length > 0
    )
}
