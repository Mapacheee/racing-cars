import type { Waypoint, Track, TrackPiece, Wall } from '../types/index'
import {
    generateProceduralControlPoints,
    generateSplineRaceTrack,
    splineTrackToTrack,
    SplinePath,
} from './SplineTrackGenerator'

// track geometry configuration
export const ROAD_GEOMETRY = {
    width: 6,
    height: 0.3,
    length: 2,
} as const

// track generation settings
export const TRACK_GENERATION = {
    segmentsPerSection: 20,
    wallLength: 4,
    minimumWaypoints: 8,
    // new spline settings - SHORTER TRACKS
    trackWidth: ROAD_GEOMETRY.width + 2, // Much smaller track width for closer walls
    baseRadius: 40, // Reduced from 80 to 40 for shorter tracks
    radiusVariation: 20, // Reduced from 50 to 30 for tighter curves
    numControlPoints: 12, // Reduced from 12 to 8 for shorter tracks
} as const

// Generate main track using spline system
function generateMainTrack(): Track {
    const controlPoints = generateProceduralControlPoints({
        numControlPoints: TRACK_GENERATION.numControlPoints,
        baseRadius: TRACK_GENERATION.baseRadius,
        radiusVariation: TRACK_GENERATION.radiusVariation,
        centerX: 0,
        centerY: 0,
        seed: 12345, // fixed seed for reproducible main track
    })

    const splineTrack = generateSplineRaceTrack(
        controlPoints,
        TRACK_GENERATION.trackWidth,
        {
            segmentsPerSpline: 8, // More segments for smoother curves
            numCheckpoints: 2, // More checkpoints for better tracking
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

// Generate a random track
export function generateRandomTrack(
    id: string,
    name: string,
    seed?: number
): Track {
    const options: Parameters<typeof generateProceduralControlPoints>[0] = {
        numControlPoints: 6 + Math.floor(Math.random() * 4), // 6-9 control points (shorter)
        baseRadius: 30 + Math.random() * 30, // 30-60 base radius (smaller)
        radiusVariation: 20 + Math.random() * 25, // 20-45 variation (tighter curves)
        centerX: 0,
        centerY: 0,
    }

    if (seed !== undefined) {
        options.seed = seed
    }

    const controlPoints = generateProceduralControlPoints(options)

    const trackWidth = 3 + Math.random() * 2 // 3-5 track width (smaller)

    const splineTrack = generateSplineRaceTrack(controlPoints, trackWidth, {
        segmentsPerSpline: 25 + Math.floor(Math.random() * 15), // 25-40 segments
        numCheckpoints: 20 + Math.floor(Math.random() * 10), // 20-30 checkpoints
        roadPieceLength: ROAD_GEOMETRY.length,
    })

    return splineTrackToTrack(splineTrack, id, name, controlPoints)
}

// main track definition - generated procedurally
const MAIN_TRACK: Track = generateMainTrack()

// exported tracks registry
export const TRACKS: Record<string, Track> = {
    main_circuit: MAIN_TRACK,
}

// Regenerate main track with new seed
export function regenerateMainTrack(seed?: number): Track {
    const controlPoints = generateProceduralControlPoints({
        numControlPoints: TRACK_GENERATION.numControlPoints,
        baseRadius: TRACK_GENERATION.baseRadius,
        radiusVariation: TRACK_GENERATION.radiusVariation,
        centerX: 0,
        centerY: 0,
        seed: seed ?? 12345, // use fixed seed 12345 for reproducible default track
    })

    const splineTrack = generateSplineRaceTrack(
        controlPoints,
        TRACK_GENERATION.trackWidth,
        {
            segmentsPerSpline: 40, // More segments for smoother curves
            numCheckpoints: 30, // More checkpoints for better tracking
            roadPieceLength: ROAD_GEOMETRY.length,
        }
    )

    const newTrack = splineTrackToTrack(
        splineTrack,
        'main_circuit',
        'Main Circuit',
        controlPoints
    )

    // Update the tracks registry
    TRACKS['main_circuit'] = newTrack

    // Notify listeners about track update
    try {
        // Dynamic import to avoid circular dependencies
        import(
            '../../../../routes/training/simulation/utils/TrackUpdateEvent'
        ).then(module => {
            module.trackUpdateEvents.notifyTrackUpdate()
        })
    } catch (error) {
        console.warn('Could not notify track update listeners:', error)
    }

    return newTrack
}

// Create a spline path for distance tracking from a track
export function createSplinePathFromTrack(track: Track): SplinePath | null {
    if (!track.splineData) {
        console.warn('Track does not have spline data for distance tracking')
        return null
    }

    return new SplinePath(track.splineData.centralPath)
}

// Re-export spline system for car tracking
export { SplinePath, CarTracker } from './SplineTrackGenerator'

// Utility functions for track navigation and waypoint calculations
export function getDistanceBetweenPoints(
    p1: { x: number; z: number },
    p2: { x: number; z: number }
): number {
    const dx = p2.x - p1.x
    const dz = p2.z - p1.z
    return Math.sqrt(dx * dx + dz * dz)
}

export function getDistanceToWaypoint(
    carX: number,
    carZ: number,
    waypoint: Waypoint
): number {
    const dx = waypoint.x - carX
    const dz = waypoint.z - carZ
    return Math.sqrt(dx * dx + dz * dz)
}

export function getDirectionToWaypoint(
    carX: number,
    carZ: number,
    waypoint: Waypoint
): { x: number; z: number } {
    const dx = waypoint.x - carX
    const dz = waypoint.z - carZ
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance === 0) return { x: 0, z: 0 }

    return {
        x: dx / distance,
        z: dz / distance,
    }
}

export function findNextWaypoint(
    carX: number,
    carZ: number,
    track: Track,
    currentWaypointIndex: number
): number {
    const currentWaypoint = track.waypoints[currentWaypointIndex]
    const distance = getDistanceToWaypoint(carX, carZ, currentWaypoint)

    if (distance < currentWaypoint.radius) {
        return (currentWaypointIndex + 1) % track.waypoints.length
    }

    return currentWaypointIndex
}

// Legacy road generation for backward compatibility (deprecated - use spline system)
export function generateRoad(_waypoints: Waypoint[]): TrackPiece[] {
    console.warn(
        'generateRoad is deprecated. Use spline-based track generation instead.'
    )
    return []
}

export function generateTrackWalls(_waypoints: Waypoint[]): Wall[] {
    console.warn(
        'generateTrackWalls is deprecated. Use spline-based track generation instead.'
    )
    return []
}
