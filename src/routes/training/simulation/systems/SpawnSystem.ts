import type { Track } from '../../../../lib/racing/track'
import type { AICar } from '../types/car'
import { GenomeBuilder, DEFAULT_NEAT_CONFIG } from '../ai'
import { TRACKS } from '../../../../lib/racing/track'

export interface SpawnConfig {
    trackId: string
    carCount: number
    colors: string[]
    useNEAT?: boolean
}

export function calculateSpawnTransform(track: Track): {
    position: [number, number, number]
    rotation: number
} {
    const firstWaypoint = track.waypoints[0]
    const secondWaypoint = track.waypoints[1]

    // Calculate rotation towards the second waypoint for correct initial direction
    const dx = secondWaypoint.x - firstWaypoint.x
    const dz = secondWaypoint.z - firstWaypoint.z
    const rotation = Math.atan2(dx, dz)

    // Calculate left offset perpendicular to the track direction
    const leftOffsetDistance = -1.0 // Distance to move cars to the left
    const leftOffsetX = -Math.cos(rotation) * leftOffsetDistance // Perpendicular to track direction
    const leftOffsetZ = Math.sin(rotation) * leftOffsetDistance

    // Position cars to the left of the first waypoint (start line)
    const position: [number, number, number] = [
        firstWaypoint.x + leftOffsetX,
        3,
        firstWaypoint.z + leftOffsetZ,
    ]

    return { position, rotation }
}

export function generateAICars(config: {
    trackId: string
    carCount: number
    colors: string[]
    useNEAT: boolean
    generation: number
    genomes?: any[] // Genomas evolucionados opcionales
}): AICar[] {
    // Use the actual track from config instead of hardcoded values
    const track = TRACKS[config.trackId] || TRACKS['main_circuit']
    const { position, rotation } = calculateSpawnTransform(track)

    const cars: AICar[] = []

    for (let i = 0; i < config.carCount; i++) {
        // All cars spawn at the exact same position (they are ghosts to each other)
        // Position is at the first waypoint which serves as the race start line
        const car: AICar = {
            id: `ai-${i + 1}`,
            position: [
                position[0], // Exact X position of first waypoint (start line)
                position[1], // Same height
                position[2], // Exact Z position of first waypoint (start line)
            ],
            rotation, // Facing towards second waypoint for correct start direction
            color: config.colors[i % config.colors.length] || 'blue',
            trackId: config.trackId,
        }

        // Usar genoma evolucionado si está disponible, sino crear uno nuevo
        if (config.useNEAT) {
            if (config.genomes && config.genomes[i]) {
                car.genome = config.genomes[i]
                console.log(
                    `🧬 Car ${car.id} using evolved genome from generation ${config.generation}`
                )
            } else {
                car.genome = GenomeBuilder.createMinimal(DEFAULT_NEAT_CONFIG)
                console.log(`🆕 Car ${car.id} using new random genome`)
            }
        }

        cars.push(car)
    }

    return cars
}
