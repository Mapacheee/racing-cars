import type { Waypoint, Track } from '../types/index'
import {
    generateProceduralControlPoints,
    generateSplineRaceTrack,
    splineTrackToTrack,
    SplinePath,
} from './SplineTrackGenerator'

export const DEFAULT_TRACK_SEED = 12345 as const

export const ROAD_GEOMETRY = {
    width: 6,
    height: 0.3,
    length: 2,
} as const

export const TRACK_GENERATION = {
    segmentsPerSection: 20,
    wallLength: 4,
    minimumWaypoints: 8,
    trackWidth: ROAD_GEOMETRY.width + 2,
    baseRadius: 40,
    radiusVariation: 20,
    numControlPoints: 12,
} as const

const generateMainTrack = (): Track => {
    const controlPoints = generateProceduralControlPoints({
        numControlPoints: TRACK_GENERATION.numControlPoints,
        baseRadius: TRACK_GENERATION.baseRadius,
        radiusVariation: TRACK_GENERATION.radiusVariation,
        centerX: 0,
        centerY: 0,
        seed: 235325,
    })

    const splineTrack = generateSplineRaceTrack(
        controlPoints,
        TRACK_GENERATION.trackWidth,
        {
            segmentsPerSpline: 8,
            numCheckpoints: 2,
            roadPieceLength: ROAD_GEOMETRY.length,
        }
    )

    return splineTrackToTrack(
        splineTrack,
        'main_circuit',
        'Main Circuit',
        controlPoints
    )
}

// generate random track
export const generateRandomTrack = (
    id: string,
    name: string,
    seed?: number
): Track => {
    const controlPoints = generateProceduralControlPoints({
        numControlPoints: 6 + Math.floor(Math.random() * 4),
        baseRadius: 30 + Math.random() * 30,
        radiusVariation: 20 + Math.random() * 25,
        centerX: 0,
        centerY: 0,
        ...(seed && { seed }),
    })

    const trackWidth = 3 + Math.random() * 2
    const splineTrack = generateSplineRaceTrack(controlPoints, trackWidth, {
        segmentsPerSpline: 25 + Math.floor(Math.random() * 15),
        numCheckpoints: 20 + Math.floor(Math.random() * 10),
        roadPieceLength: ROAD_GEOMETRY.length,
    })

    const track = splineTrackToTrack(splineTrack, id, name, controlPoints)
    TRACKS[id] = track
    TRACKS['current'] = track
    return track
}

// init tracks
const MAIN_TRACK: Track = generateMainTrack()

export const TRACKS: Record<string, Track> = {
    main_circuit: MAIN_TRACK,
}

// Regenerate track with new seed
export const regenerateMainTrack = (seed?: number): Track => {
    const controlPoints = generateProceduralControlPoints({
        numControlPoints: TRACK_GENERATION.numControlPoints,
        baseRadius: TRACK_GENERATION.baseRadius,
        radiusVariation: TRACK_GENERATION.radiusVariation,
        centerX: 0,
        centerY: 0,
        seed: seed ?? DEFAULT_TRACK_SEED,
    })

    const splineTrack = generateSplineRaceTrack(
        controlPoints,
        TRACK_GENERATION.trackWidth,
        {
            segmentsPerSpline: 40,
            numCheckpoints: 30,
            roadPieceLength: ROAD_GEOMETRY.length,
        }
    )

    const newTrack = {
        ...splineTrackToTrack(
            splineTrack,
            'main_circuit',
            'Main Circuit',
            controlPoints
        ),
        seed: seed ?? DEFAULT_TRACK_SEED,
    }

    TRACKS['main_circuit'] = newTrack

    // notify track update listeners
    try {
        import('../../../../routes/training/simulation/utils/TrackUpdateEvent').then(module => {
            module.trackUpdateEvents.notify()
        })
    } catch (error) {
        console.warn('Could not notify track update listeners:', error)
    }

    return newTrack
}

// create spline path from track
export const createSplinePathFromTrack = (track: Track): SplinePath | null => {
    if (!track.splineData) {
        console.warn('Track does not have spline data for distance tracking')
        return null
    }
    return new SplinePath(track.splineData.centralPath)
}

export { SplinePath, CarTracker } from './SplineTrackGenerator'

// utility functions with functional approach
export const getDistanceBetweenPoints = (
    p1: { x: number; z: number },
    p2: { x: number; z: number }
): number => {
    const dx = p2.x - p1.x
    const dz = p2.z - p1.z
    return Math.sqrt(dx * dx + dz * dz)
}

export const getDistanceToWaypoint = (
    carX: number,
    carZ: number,
    waypoint: Waypoint
): number => {
    const dx = waypoint.x - carX
    const dz = waypoint.z - carZ
    return Math.sqrt(dx * dx + dz * dz)
}

export const getDirectionToWaypoint = (
    carX: number,
    carZ: number,
    waypoint: Waypoint
): { x: number; z: number } => {
    const dx = waypoint.x - carX
    const dz = waypoint.z - carZ
    const distance = Math.sqrt(dx * dx + dz * dz)

    return distance === 0 
        ? { x: 0, z: 0 }
        : { x: dx / distance, z: dz / distance }
}

export const findNextWaypoint = (
    carX: number,
    carZ: number,
    track: Track,
    currentWaypointIndex: number
): number => {
    const currentWaypoint = track.waypoints[currentWaypointIndex]
    const distance = getDistanceToWaypoint(carX, carZ, currentWaypoint)

    return distance < currentWaypoint.radius
        ? (currentWaypointIndex + 1) % track.waypoints.length
        : currentWaypointIndex
}
