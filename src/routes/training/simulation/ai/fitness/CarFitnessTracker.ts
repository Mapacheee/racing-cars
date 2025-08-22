import { Vector3 } from 'three'
import type { FitnessMetrics } from '../../types/neat'
import type { Waypoint } from '../../../../../lib/racing/track'
import type { SensorReading } from '../../types/sensors'
import { TrackDistanceTracker } from './TrackDistanceTracker'

export class CarFitnessTracker {
    public getCurrentWaypointIndex(): number {
        return this.currentWaypointIndex
    }
    private steeringHistory: number[] = []
    private steeringPenaltyAccumulator: number = 0
    private metrics: FitnessMetrics
    private carId: string
    private startTime: number
    private lastProgressTime: number
    private speedSamples: number[] = []
    private sensorBonusAccumulator: number = 0
    private trackDistanceTracker: TrackDistanceTracker
    private waypointTimes: number[] = []
    private lapCompleted: boolean = false
    private currentWaypointIndex: number = 0
    private waypoints: Waypoint[]

    constructor(carId: string, startPosition: Vector3, waypoints: Waypoint[]) {
        this.carId = carId
        this.waypoints = waypoints
        this.metrics = {
            distanceTraveled: 0,
            timeAlive: 0,
            averageSpeed: 0,
            checkpointsReached: 0,
            collisions: 0,
            backwardMovement: 0,
        }

        this.startTime = Date.now()
        this.lastProgressTime = this.startTime
        this.sensorBonusAccumulator = 0
        this.trackDistanceTracker = new TrackDistanceTracker(waypoints)

        this.trackDistanceTracker.resetCar(this.carId, startPosition)
    }

    recordSteering(steering: number): void {
        this.steeringHistory.push(steering)
        if (this.steeringHistory.length > 120) {
            this.steeringHistory.shift()
        }
        const sum = this.steeringHistory.reduce((a, b) => a + b, 0)
        if (Math.abs(sum) > 80) {
            this.steeringPenaltyAccumulator -= 0.5
        }
    }

    update(currentPosition: Vector3, velocity: Vector3): void {
        const now = Date.now()
        const deltaTime = (now - this.startTime) / 1000

        this.metrics.timeAlive = deltaTime

        const forwardDirection =
            velocity.length() > 0.1
                ? velocity.clone().normalize()
                : this.getForwardDirectionToNextWaypoint(currentPosition)

        const trackingResult = this.trackDistanceTracker.updateCarPosition(
            this.carId,
            currentPosition,
            forwardDirection
        )

        this.metrics.distanceTraveled = trackingResult.totalDistance

        if (trackingResult.distanceDelta > 0.1) {
            this.lastProgressTime = now
        }

        if (trackingResult.distanceDelta < -0.1) {
            this.metrics.backwardMovement += Math.abs(
                trackingResult.distanceDelta
            )
        }

        const currentSpeed = velocity.length()
        this.speedSamples.push(currentSpeed)

        if (this.speedSamples.length > 60) {
            this.speedSamples.shift()
        }

        this.metrics.averageSpeed =
            this.speedSamples.reduce((a, b) => a + b, 0) /
            this.speedSamples.length

        this.updateCheckpoints(currentPosition)

        if (Math.random() < 0.001) {
            console.log(
                `🏁 Car ${this.carId} - Distance: ${trackingResult.totalDistance.toFixed(1)}, ` +
                    `Progress: ${(trackingResult.progress * 100).toFixed(1)}%, ` +
                    `Forward: ${trackingResult.isGoingForward}, ` +
                    `Track Distance: ${trackingResult.distanceFromTrack.toFixed(2)}`
            )
        }
    }

    private getForwardDirectionToNextWaypoint(
        currentPosition: Vector3
    ): Vector3 {
        const targetWaypoint = this.waypoints[this.currentWaypointIndex]

        if (targetWaypoint) {
            const direction = new Vector3(
                targetWaypoint.x - currentPosition.x,
                0,
                targetWaypoint.z - currentPosition.z
            )

            return direction.length() > 0
                ? direction.normalize()
                : new Vector3(0, 0, 1)
        }

        return new Vector3(0, 0, 1)
    }

    recordCollision(): void {
        this.metrics.collisions++
    }

    updateSensorFitness(sensorReadings: SensorReading): void {
        const sensorSum =
            sensorReadings.left +
            sensorReadings.leftCenter +
            sensorReadings.center +
            sensorReadings.rightCenter +
            sensorReadings.right

        ;(
            [
                'left',
                'leftCenter',
                'center',
                'rightCenter',
                'right',
            ] as (keyof SensorReading)[]
        ).forEach(key => {
            if (sensorReadings[key] > 0.7) {
                this.sensorBonusAccumulator += 0.07
            }
        })

        if (sensorReadings.center > 0.7) {
            this.sensorBonusAccumulator += 0.12
        }

        if (sensorReadings.left < 0.3) {
            this.sensorBonusAccumulator -= 0.08
        }
        if (sensorReadings.right < 0.3) {
            this.sensorBonusAccumulator -= 0.08
        }

        if (sensorSum > 4.0) {
            this.sensorBonusAccumulator += 0.03
        }
    }

    private updateCheckpoints(position: Vector3): void {
        const currentWaypoint = this.waypoints[this.currentWaypointIndex]
        if (currentWaypoint) {
            const distance = Math.sqrt(
                Math.pow(position.x - currentWaypoint.x, 2) +
                    Math.pow(position.z - currentWaypoint.z, 2)
            )
            const waypointRadius = Math.max(5.0)

            if (distance < waypointRadius) {
                const now = Date.now()
                this.waypointTimes.push(now - this.startTime)
                this.lastProgressTime = now

                if (this.currentWaypointIndex > 0) {
                    this.metrics.checkpointsReached++
                    // console.log(
                    //     `🎯 Car ${this.carId} reached waypoint ${this.currentWaypointIndex + 1}/${this.waypoints.length}`
                    // )
                }

                this.currentWaypointIndex++
                if (this.currentWaypointIndex >= this.waypoints.length) {
                    this.lapCompleted = true
                    console.log(
                        `🏁 Car ${this.carId} completed lap in ${(now - this.startTime) / 1000}s`
                    )
                }
            }
        }
    }

    getFitnessMetrics(): FitnessMetrics {
        return { ...this.metrics }
    }

    getCurrentCheckpoint(): number {
        return this.currentWaypointIndex
    }

    getProgress(): number {
        return (this.metrics.checkpointsReached / this.waypoints.length) * 100
    }

    calculateFitness(): number {
        const now = Date.now()
        const timeAlive = (now - this.startTime) / 1000

        const distanceBonus = Math.min(this.metrics.distanceTraveled * 1.2, 60)

        const speedBonus = Math.min(this.metrics.averageSpeed * 3, 10)

        const sensorBonus = Math.min(this.sensorBonusAccumulator, 8)

        const waypointPoints = this.metrics.checkpointsReached * 180
        const waypointBonus = Math.pow(this.metrics.checkpointsReached, 2) * 40

        const lapBonus = this.lapCompleted
            ? Math.max(120 - timeAlive / 2, 40)
            : 0

        const backwardPenalty = this.metrics.backwardMovement * -1.2
        const collisionPenalty = this.metrics.collisions * -30
        const inactivityPenalty = this.getInactivityPenalty() * 2

        let totalFitness =
            distanceBonus +
            speedBonus +
            sensorBonus +
            waypointPoints +
            waypointBonus +
            lapBonus +
            backwardPenalty +
            collisionPenalty +
            inactivityPenalty +
            this.steeringPenaltyAccumulator

        if (this.metrics.checkpointsReached === 0) {
            totalFitness = Math.min(totalFitness, 1.0)
        }

        return Math.max(0.1, totalFitness)
    }

    private getInactivityPenalty(): number {
        const now = Date.now()
        const timeSinceProgress = (now - this.lastProgressTime) / 1000

        if (timeSinceProgress > 8) return -8
        if (timeSinceProgress > 6) return -4
        if (timeSinceProgress > 4) return -1
        return 0
    }

    hasTimeout(): boolean {
        const now = Date.now()
        const timeSinceProgress = (now - this.lastProgressTime) / 1000
        return timeSinceProgress > 5
    }

    isLapCompleted(): boolean {
        return this.lapCompleted
    }

    reset(startPosition: Vector3): void {
        this.metrics = {
            distanceTraveled: 0,
            timeAlive: 0,
            averageSpeed: 0,
            checkpointsReached: 0,
            collisions: 0,
            backwardMovement: 0,
        }

        this.startTime = Date.now()
        this.lastProgressTime = this.startTime
        this.speedSamples = []
        this.currentWaypointIndex = 0
        this.waypointTimes = []
        this.lapCompleted = false
        this.sensorBonusAccumulator = 0

        this.trackDistanceTracker.resetCar(this.carId, startPosition)
    }

    destroy(): void {
        this.trackDistanceTracker.removeCar(this.carId)
    }
}
