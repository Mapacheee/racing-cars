import type { Track } from '../../../../lib/racing/track'
import type { AICar } from '../types/car'
import { Neat, methods } from 'neataptic';
import { TRACKS } from '../../../../lib/racing/track'
import { generateBaseCars } from '../../../../lib/racing/cars/systems/SpawnSystem'

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
    const track = TRACKS[config.trackId] || TRACKS['main_circuit'];
    // Forzar formación 'single' para que todos los autos IA spawneen en el mismo lugar
    const singleConfig = { ...config, formation: 'single' as const };
    const baseCars = generateBaseCars(singleConfig, track);
    return baseCars.map((baseCar: any, i: number) => {
        const aiCar: AICar = {
            ...baseCar,
        };
        if (config.useNEAT) {
            if (config.genomes && config.genomes[i]) {
                if (typeof config.genomes[i].toJSON === 'function') {
                    aiCar.genome = config.genomes[i].toJSON();
                } else {
                    aiCar.genome = config.genomes[i];
                }
                console.log(
                    `🧬 Car ${aiCar.id} using evolved network JSON from generation ${config.generation}`
                );
            } else {
                const tempNeat = new Neat(6, 3, null, {
                    mutation: methods.mutation.ALL,
                    popsize: 1,
                });
                aiCar.genome = tempNeat.population[0].toJSON();
                console.log(`🆕 Car ${aiCar.id} using new random network JSON`);
            }
        }
        return aiCar;
    });
}
