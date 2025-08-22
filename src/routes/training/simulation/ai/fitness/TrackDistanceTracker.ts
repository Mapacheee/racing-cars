import { Vector3 } from 'three'
import type { Waypoint } from '../../../../../lib/racing/track'

interface TrackSegment {
    startPoint: Vector3
    endPoint: Vector3
    direction: Vector3 // normalized direction vector
    length: number
}

interface TrackData {
    segments: TrackSegment[]
    cumulativeDistances: number[] // cum[i] = total distance from start to beginning of segment i
    totalLength: number
}

interface ProjectionResult {
    segmentIndex: number
    t: number // parameter along segment (0-1)
    closestPoint: Vector3
    distanceToTrack: number
    progress: number // distance along track from start
}

interface CarTrackingState {
    lastProgress: number
    totalAccumulated: number
    lastSegmentIndex: number // cache for faster segment search
    isGoingForward: boolean
}

export class TrackDistanceTracker {
    private trackData: TrackData
    private carStates: Map<string, CarTrackingState> = new Map()

    constructor(waypoints: Waypoint[]) {
        this.trackData = this.precomputeTrackData(waypoints)
    }

    private precomputeTrackData(waypoints: Waypoint[]): TrackData {
        const segments: TrackSegment[] = []
        const cumulativeDistances: number[] = [0]
        let totalDistance = 0

        for (let i = 0; i < waypoints.length; i++) {
            const current = waypoints[i]
            const next = waypoints[(i + 1) % waypoints.length]

            const startPoint = new Vector3(current.x, 0, current.z)
            const endPoint = new Vector3(next.x, 0, next.z)
            const segmentVector = endPoint.clone().sub(startPoint)
            const length = segmentVector.length()
            const direction =
                length > 0 ? segmentVector.normalize() : new Vector3(0, 0, 1)

            segments.push({
                startPoint,
                endPoint,
                direction,
                length,
            })

            totalDistance += length
            cumulativeDistances.push(totalDistance)
        }

        return {
            segments,
            cumulativeDistances,
            totalLength: totalDistance,
        }
    }

    private projectPositionOntoTrack(
        position: Vector3,
        lastSegmentIndex: number = 0
    ): ProjectionResult {
        let bestProjection: ProjectionResult | null = null
        let minDistance = Infinity

        // Search around the last known segment for efficiency (±8 segments)
        const searchRadius = Math.min(
            8,
            Math.floor(this.trackData.segments.length / 2)
        )
        const segmentCount = this.trackData.segments.length

        for (let offset = 0; offset <= searchRadius; offset++) {
            const indices =
                offset === 0
                    ? [lastSegmentIndex]
                    : [
                          (lastSegmentIndex + offset) % segmentCount,
                          (lastSegmentIndex - offset + segmentCount) %
                              segmentCount,
                      ]

            for (const segmentIndex of indices) {
                const segment = this.trackData.segments[segmentIndex]
                const projection = this.projectPointOntoSegment(
                    position,
                    segment,
                    segmentIndex
                )

                if (projection.distanceToTrack < minDistance) {
                    minDistance = projection.distanceToTrack
                    bestProjection = projection
                }
            }
        }

        return bestProjection!
    }

    private projectPointOntoSegment(
        point: Vector3,
        segment: TrackSegment,
        segmentIndex: number
    ): ProjectionResult {
        const pointVector = point.clone().sub(segment.startPoint)

        const segmentVector = segment.endPoint.clone().sub(segment.startPoint)
        const dot = pointVector.dot(segmentVector)

        let t = segment.length > 0 ? dot / (segment.length * segment.length) : 0
        t = Math.max(0, Math.min(1, t)) // clamp to [0, 1]

        const closestPoint = segment.startPoint
            .clone()
            .add(segmentVector.clone().multiplyScalar(t))

        const distanceToTrack = point.distanceTo(closestPoint)

        const progress =
            this.trackData.cumulativeDistances[segmentIndex] +
            t * segment.length

        return {
            segmentIndex,
            t,
            closestPoint,
            distanceToTrack,
            progress,
        }
    }

    updateCarPosition(
        carId: string,
        position: Vector3,
        forwardDirection: Vector3
    ): {
        distanceDelta: number
        totalDistance: number
        isGoingForward: boolean
        distanceFromTrack: number
        progress: number
    } {
        let carState = this.carStates.get(carId)
        if (!carState) {
            const initialProjection = this.projectPositionOntoTrack(position, 0)
            carState = {
                lastProgress: initialProjection.progress,
                totalAccumulated: 0,
                lastSegmentIndex: initialProjection.segmentIndex,
                isGoingForward: true,
            }
            this.carStates.set(carId, carState)
        }

        const projection = this.projectPositionOntoTrack(
            position,
            carState.lastSegmentIndex
        )

        let delta = projection.progress - carState.lastProgress

        if (delta < -this.trackData.totalLength / 2) {
            delta += this.trackData.totalLength // wrapped forward
        } else if (delta > this.trackData.totalLength / 2) {
            delta -= this.trackData.totalLength // wrapped backward
        }

        const trackDirection =
            this.trackData.segments[projection.segmentIndex].direction
        const directionDot = forwardDirection.dot(trackDirection)
        const isGoingForward = directionDot > 0.4

        const signedDelta = isGoingForward ? Math.abs(delta) : -Math.abs(delta)

        carState.lastProgress = projection.progress
        carState.totalAccumulated += Math.abs(signedDelta)
        carState.lastSegmentIndex = projection.segmentIndex
        carState.isGoingForward = isGoingForward

        return {
            distanceDelta: signedDelta,
            totalDistance: carState.totalAccumulated,
            isGoingForward,
            distanceFromTrack: projection.distanceToTrack,
            progress: projection.progress / this.trackData.totalLength, // normalized 0-1
        }
    }

    resetCar(carId: string, position: Vector3): void {
        const initialProjection = this.projectPositionOntoTrack(position, 0)
        this.carStates.set(carId, {
            lastProgress: initialProjection.progress,
            totalAccumulated: 0,
            lastSegmentIndex: initialProjection.segmentIndex,
            isGoingForward: true,
        })
    }

    getCarState(carId: string): CarTrackingState | undefined {
        return this.carStates.get(carId)
    }

    getTrackInfo(): { totalLength: number; segmentCount: number } {
        return {
            totalLength: this.trackData.totalLength,
            segmentCount: this.trackData.segments.length,
        }
    }

    removeCar(carId: string): void {
        this.carStates.delete(carId)
    }
}
