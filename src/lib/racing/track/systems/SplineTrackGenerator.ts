import * as THREE from 'three'
import type { Waypoint, Track, TrackPiece, Wall } from '../types/index'

// --- Helpers (used by the path generation) ---
function normalizeVector(v: { x: number; y: number }): {
    x: number
    y: number
} {
    const length = Math.hypot(v.x, v.y)
    return length === 0 ? { x: 0, y: 0 } : { x: v.x / length, y: v.y / length }
}

function getPerpendicularNormal(direction: { x: number; y: number }): {
    x: number
    y: number
} {
    // (-dy, dx) normalized
    return normalizeVector({ x: -direction.y, y: direction.x })
}

// Catmull-Rom interpolation (returns a point on the spline segment)
function interpolateCatmullRom(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
): { x: number; y: number } {
    const t2 = t * t
    const t3 = t2 * t

    const c1 = 0.5 * (-p0.x + p2.x)
    const c2 = 0.5 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x)
    const c3 = 0.5 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x)
    const x = p1.x + c1 * t + c2 * t2 + c3 * t3

    const d1 = 0.5 * (-p0.y + p2.y)
    const d2 = 0.5 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y)
    const d3 = 0.5 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y)
    const y = p1.y + d1 * t + d2 * t2 + d3 * t3

    return { x, y }
}

// Get the derivative (tangent) of Catmull-Rom spline at point t
function interpolateCatmullRomDerivative(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
): { x: number; y: number } {
    const t2 = t * t

    const c1 = 0.5 * (-p0.x + p2.x)
    const c2 = 0.5 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x)
    const c3 = 0.5 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x)
    const dx = c1 + 2 * c2 * t + 3 * c3 * t2

    const d1 = 0.5 * (-p0.y + p2.y)
    const d2 = 0.5 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y)
    const d3 = 0.5 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y)
    const dy = d1 + 2 * d2 * t + 3 * d3 * t2

    return { x: dx, y: dy }
}

// --- Generate control points procedurally (radial sampling with random radius per point) ---
export function generateProceduralControlPoints(
    options: {
        numControlPoints?: number
        baseRadius?: number
        radiusVariation?: number
        centerX?: number
        centerY?: number
        seed?: number
    } = {}
): { x: number; y: number }[] {
    const numControlPoints =
        options.numControlPoints ?? 6 + Math.floor(Math.random() * 3)
    const baseRadius = options.baseRadius ?? 100
    const radiusVariation = options.radiusVariation ?? 50
    const centerX = options.centerX ?? 0
    const centerY = options.centerY ?? 0

    // Use seed for reproducible tracks if provided
    let random = Math.random
    if (options.seed !== undefined) {
        // Simple seeded random number generator
        let seed = options.seed
        random = () => {
            seed = (seed * 9301 + 49297) % 233280
            return seed / 233280
        }
    }

    const rotationAngle = random() * Math.PI * 2 // random global rotation
    const proceduralControlPoints: { x: number; y: number }[] = []

    for (let i = 0; i < numControlPoints; i++) {
        const angle = rotationAngle + (i / numControlPoints) * Math.PI * 2
        // radius = baseRadius +/- random variation
        const radius = baseRadius + (random() * 2 - 1) * radiusVariation
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        proceduralControlPoints.push({ x, y })
    }

    return proceduralControlPoints
}

// Spline path with distance calculation capabilities
export class SplinePath {
    public curve: THREE.CatmullRomCurve3
    public points: THREE.Vector3[]
    public totalLength: number
    public lengths: number[] // accumulated lengths at each point
    // private segmentCount: number

    constructor(controlPoints: { x: number; y: number }[], segmentCount = 200) {
        // this.segmentCount = segmentCount

        // Convert 2D control points to 3D (y=0)
        const points3D = controlPoints.map(p => new THREE.Vector3(p.x, 0, p.y))

        // Create closed curve
        this.curve = new THREE.CatmullRomCurve3(points3D, true)

        // Generate points along the curve
        this.points = this.curve.getPoints(segmentCount)

        // Calculate lengths
        this.lengths = this.curve.getLengths(segmentCount)
        this.totalLength = this.lengths[this.lengths.length - 1]
    }

    // Get point at distance t (0-1) along the curve
    getPointAt(t: number): THREE.Vector3 {
        return this.curve.getPointAt(t)
    }

    // Get tangent (direction) at distance t (0-1) along the curve
    getTangentAt(t: number): THREE.Vector3 {
        return this.curve.getTangentAt(t).normalize()
    }

    // Convert distance along curve to t parameter (0-1)
    distanceToT(distance: number): number {
        if (distance <= 0) return 0
        if (distance >= this.totalLength) return 1

        // Binary search for the correct segment
        let low = 0
        let high = this.lengths.length - 1

        while (low <= high) {
            const mid = Math.floor((low + high) / 2)
            if (this.lengths[mid] < distance) {
                low = mid + 1
            } else if (this.lengths[mid] > distance) {
                high = mid - 1
            } else {
                return mid / (this.lengths.length - 1)
            }
        }

        // Interpolate between segments
        const segmentIndex = Math.max(0, high)
        const nextIndex = Math.min(this.lengths.length - 1, segmentIndex + 1)

        if (segmentIndex === nextIndex) {
            return segmentIndex / (this.lengths.length - 1)
        }

        const segmentLength =
            this.lengths[nextIndex] - this.lengths[segmentIndex]
        const segmentProgress =
            (distance - this.lengths[segmentIndex]) / segmentLength

        return (segmentIndex + segmentProgress) / (this.lengths.length - 1)
    }

    // Find closest point on curve to given position
    getClosestPoint(position: THREE.Vector3): {
        point: THREE.Vector3
        t: number
        distance: number
    } {
        let closestDistance = Infinity
        let closestT = 0
        let closestPoint = new THREE.Vector3()

        // Sample the curve to find closest point
        const samples = 100
        for (let i = 0; i <= samples; i++) {
            const t = i / samples
            const point = this.getPointAt(t)
            const distance = position.distanceTo(point)

            if (distance < closestDistance) {
                closestDistance = distance
                closestT = t
                closestPoint = point.clone()
            }
        }

        // Refine the search around the closest point
        const refinement = 0.01
        const startT = Math.max(0, closestT - refinement)
        const endT = Math.min(1, closestT + refinement)

        for (let i = 0; i <= 20; i++) {
            const t = startT + (endT - startT) * (i / 20)
            const point = this.getPointAt(t)
            const distance = position.distanceTo(point)

            if (distance < closestDistance) {
                closestDistance = distance
                closestT = t
                closestPoint = point.clone()
            }
        }

        return { point: closestPoint, t: closestT, distance: closestDistance }
    }

    // Calculate the distance traveled along the spline at parameter t
    getDistanceAt(t: number): number {
        if (t <= 0) return 0
        if (t >= 1) return this.totalLength

        const index = t * (this.lengths.length - 1)
        const lower = Math.floor(index)
        const upper = Math.ceil(index)

        if (lower === upper) {
            return this.lengths[lower]
        }

        const fraction = index - lower
        return (
            this.lengths[lower] +
            (this.lengths[upper] - this.lengths[lower]) * fraction
        )
    }
}

// --- Build a race track from control points using Catmull-Rom splines ---
export function generateSplineRaceTrack(
    controlPoints: { x: number; y: number }[],
    trackWidth: number,
    options: {
        segmentsPerSpline?: number
        numCheckpoints?: number
        roadPieceLength?: number
    } = {}
): {
    centralPath: { x: number; y: number }[]
    innerWalls: Wall[]
    outerWalls: Wall[]
    checkpoints: {
        center: { x: number; y: number }
        normal: { x: number; y: number }
        width: number
    }[]
    startPoint: { x: number; y: number }
    trackWidth: number
    splinePath: SplinePath
    totalLength: number
} {
    const segmentsPerSpline = options.segmentsPerSpline ?? 20
    const numCheckpoints = options.numCheckpoints ?? 20
    // const roadPieceLength = options.roadPieceLength ?? 4

    // centralPath is the interpolated set of points along the closed spline
    const centralPath: { x: number; y: number }[] = []
    if (!controlPoints || controlPoints.length < 4) {
        return {
            centralPath: [],
            innerWalls: [],
            outerWalls: [],
            checkpoints: [],
            startPoint: { x: 0, y: 0 },
            trackWidth,
            splinePath: new SplinePath([]),
            totalLength: 0,
        }
    }

    // wrap control points to make a closed loop for Catmull-Rom interpolation
    const wrapped = [
        controlPoints[controlPoints.length - 1],
        ...controlPoints,
        controlPoints[0],
        controlPoints[1],
    ]

    for (let i = 0; i < controlPoints.length; i++) {
        const p0 = wrapped[i]
        const p1 = wrapped[i + 1]
        const p2 = wrapped[i + 2]
        const p3 = wrapped[i + 3]

        for (let j = 0; j < segmentsPerSpline; j++) {
            const t = j / segmentsPerSpline
            const pt = interpolateCatmullRom(p0, p1, p2, p3, t)
            centralPath.push(pt)
        }
    }

    // ensure loop closed
    if (
        centralPath.length > 0 &&
        (centralPath[centralPath.length - 1].x !== centralPath[0].x ||
            centralPath[centralPath.length - 1].y !== centralPath[0].y)
    ) {
        centralPath.push(centralPath[0])
    }

    // Create spline path for distance calculations
    const splinePath = new SplinePath(centralPath, centralPath.length * 2)

    // Generate walls by computing normals per-segment
    const innerWalls: Wall[] = []
    const outerWalls: Wall[] = []
    const wallVisualWidth = 1.5;
    const halfWidth = (trackWidth / 2) - (wallVisualWidth / 2);

    for (let i = 0; i < centralPath.length - 1; i++) {
        const a = centralPath[i]
        const b = centralPath[(i + 1) % (centralPath.length - 1)]
        const dir = { x: b.x - a.x, y: b.y - a.y }
        const normal = getPerpendicularNormal(dir)

        const currentInner = {
            x: a.x - normal.x * halfWidth,
            z: a.y - normal.y * halfWidth,
        }
        const currentOuter = {
            x: a.x + normal.x * halfWidth,
            z: a.y + normal.y * halfWidth,
        }
        const nextInner = {
            x: b.x - normal.x * halfWidth,
            z: b.y - normal.y * halfWidth,
        }
        const nextOuter = {
            x: b.x + normal.x * halfWidth,
            z: b.y + normal.y * halfWidth,
        }

        innerWalls.push({ start: currentInner, end: nextInner, side: 'left' })
        outerWalls.push({ start: currentOuter, end: nextOuter, side: 'right' })
    }

    // create checkpoints by sampling the centralPath at intervals
    const checkpoints: {
        center: { x: number; y: number }
        normal: { x: number; y: number }
        width: number
    }[] = []
    const checkpointInterval = Math.floor(centralPath.length / numCheckpoints)
    for (let i = 0; i < numCheckpoints; i++) {
        const idx = (i * checkpointInterval) % (centralPath.length - 1)
        const center = centralPath[idx]
        const next = centralPath[(idx + 1) % (centralPath.length - 1)]
        const dir = { x: next.x - center.x, y: next.y - center.y }
        const normal = getPerpendicularNormal(dir)
        checkpoints.push({ center, normal, width: trackWidth })
    }

    return {
        centralPath,
        innerWalls,
        outerWalls,
        checkpoints,
        startPoint: centralPath[0],
        trackWidth,
        splinePath,
        totalLength: splinePath.totalLength,
    }
}

// Convert spline track data to our Track interface
export function splineTrackToTrack(
    splineTrack: ReturnType<typeof generateSplineRaceTrack>,
    id: string,
    name: string,
    originalControlPoints?: { x: number; y: number }[]
): Track {
    // Generate road pieces
    const pieces: TrackPiece[] = []
    const roadSegmentSeparation = 0.5
    const numPieces = Math.floor(
        splineTrack.totalLength / roadSegmentSeparation
    )

    for (let i = 0; i < numPieces; i++) {
        const t = i / numPieces
        const point = splineTrack.splinePath.getPointAt(t)
        const tangent = splineTrack.splinePath.getTangentAt(t)
        const rotation = Math.atan2(tangent.x, tangent.z)

        pieces.push({
            model: 'road_segment',
            position: [point.x, -0.6, point.z], // y = -0.6 to match current road height
            rotation: [0, rotation, 0],
        })
    }

    // Convert waypoints from central path (sample every N points)
    const waypoints: Waypoint[] = []
    const waypointInterval = Math.max(
        1,
        Math.floor(splineTrack.centralPath.length / 40) // More waypoints for better curve tracking
    )

    for (let i = 0; i < splineTrack.centralPath.length; i += waypointInterval) {
        const point = splineTrack.centralPath[i]
        waypoints.push({
            x: point.x,
            z: point.y, // convert y to z for 3D space
            radius: splineTrack.trackWidth / 2,
        })
    }

    // Combine inner and outer walls
    const walls: Wall[] = [...splineTrack.innerWalls, ...splineTrack.outerWalls]

    return {
        id,
        name,
        waypoints,
        pieces,
        walls,
        length: splineTrack.totalLength,
        // Store spline data for distance tracking
        splineData: {
            controlPoints: originalControlPoints || [],
            centralPath: splineTrack.centralPath,
            trackWidth: splineTrack.trackWidth,
        },
    }
}

// Car tracking system for spline-based tracks
export class CarTracker {
    private splinePath: SplinePath
    private lastT: number = 0
    private totalDistance: number = 0
    private direction: number = 1 // 1 for forward, -1 for reverse

    constructor(splinePath: SplinePath) {
        this.splinePath = splinePath
    }

    // Update car position and calculate distance traveled
    updatePosition(carPosition: THREE.Vector3): {
        currentT: number
        distanceTraveled: number
        totalDistance: number
        isGoingReverse: boolean
        closestPoint: THREE.Vector3
        distanceFromTrack: number
    } {
        const closest = this.splinePath.getClosestPoint(carPosition)
        const currentT = closest.t

        // For now, assume car is always moving forward along track
        // In a real implementation, you'd get this from car velocity
        const deltaT = currentT - this.lastT

        // Handle wrap-around for closed tracks
        let adjustedDeltaT = deltaT
        if (Math.abs(deltaT) > 0.5) {
            adjustedDeltaT = deltaT > 0 ? deltaT - 1 : deltaT + 1
        }

        // Determine if going reverse based on delta
        const isGoingReverse = adjustedDeltaT < 0
        this.direction = isGoingReverse ? -1 : 1

        // Calculate distance traveled this frame
        const distanceTraveled =
            Math.abs(adjustedDeltaT) * this.splinePath.totalLength
        this.totalDistance += distanceTraveled * this.direction

        this.lastT = currentT

        return {
            currentT,
            distanceTraveled,
            totalDistance: this.totalDistance,
            isGoingReverse,
            closestPoint: closest.point,
            distanceFromTrack: closest.distance,
        }
    }

    // Reset tracking
    reset(startingT = 0): void {
        this.lastT = startingT
        this.totalDistance = 0
        this.direction = 1
    }

    // Get current progress (0-1) around the track
    getProgress(): number {
        return this.lastT
    }

    // Get total distance traveled (can be negative if going reverse)
    getTotalDistance(): number {
        return this.totalDistance
    }
}
