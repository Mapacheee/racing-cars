import type { Track } from '../../track'
import type { BaseCar } from '../types'

export interface SpawnConfig {
    trackId: string
    carCount: number
    colors: string[]
    startOffset?: number
    formation?: 'single' | 'grid' | 'random'
}

export const calculateSpawnTransform = (track: Track): {
    position: [number, number, number]
    rotation: number
} => {
    const [firstWaypoint, secondWaypoint] = track.waypoints.slice(0, 2)
    
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

const calculateGridPosition = (
    basePosition: [number, number, number],
    index: number
): [number, number, number] => {
    const gridSize = Math.ceil(Math.sqrt(index + 1))
    const row = Math.floor(index / gridSize)
    const col = index % gridSize
    
    return [
        basePosition[0] + (col - gridSize / 2) * 2,
        basePosition[1],
        basePosition[2] - row * 3,
    ]
}

const calculateRandomPosition = (
    basePosition: [number, number, number]
): [number, number, number] => [
    basePosition[0] + (Math.random() - 0.5) * 10,
    basePosition[1],
    basePosition[2] + (Math.random() - 0.5) * 5,
]

const calculateFormationPosition = (
    basePosition: [number, number, number],
    index: number,
    formation: 'single' | 'grid' | 'random'
): [number, number, number] => {
    switch (formation) {
        case 'grid': return calculateGridPosition(basePosition, index)
        case 'random': return calculateRandomPosition(basePosition)
        case 'single':
        default: return basePosition
    }
}

export const generateBaseCars = (config: SpawnConfig, track: Track): BaseCar[] => {
    const { position, rotation } = calculateSpawnTransform(track)
    const formation = config.formation || 'single'

    return Array.from({ length: config.carCount }, (_, i) => ({
        id: `car-${i + 1}`,
        position: calculateFormationPosition(position, i, formation),
        rotation,
        color: config.colors[i % config.colors.length] || '#ff0000',
        trackId: config.trackId,
    }))
}

export const generateCarColors = (count: number): string[] => {
    const baseColors = [
        '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff',
        '#00ffff', '#ffa500', '#800080', '#008000', '#000080',
    ]

    return Array.from({ length: count }, (_, i) => 
        baseColors[i % baseColors.length]
    )
}

export const validateSpawnConfig = (config: SpawnConfig): boolean =>
    config.carCount > 0 && 
    config.trackId.length > 0 && 
    config.colors.length > 0
