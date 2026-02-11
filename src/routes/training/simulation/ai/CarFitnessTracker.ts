import type { FitnessMetrics } from '../types/neat'
import { calculateFitness } from './neat/NEATConfig'

// Fitness tracker for AI cars
export class CarFitnessTracker {
    private metrics: FitnessMetrics = {
        distanceTraveled: 0,
        timeAlive: 0,
        averageSpeed: 0,
        checkpointsReached: 0,
        collisions: 0,
    }

    private startTime: number = Date.now()
    private lastPosition: [number, number, number] = [0, 0, 0]
    private speedSamples: number[] = []
    private currentWaypointIndex: number = 0

    constructor(_carId: string, startPos: [number, number, number], _waypoints: any[]) {
        this.lastPosition = startPos
        this.startTime = Date.now()
    }

    reset(position: [number, number, number]) {
        this.lastPosition = position
        this.startTime = Date.now()
        this.metrics = {
            distanceTraveled: 0,
            timeAlive: 0,
            averageSpeed: 0,
            checkpointsReached: 0,
            collisions: 0,
        }
        this.speedSamples = []
        this.currentWaypointIndex = 0
    }

    updatePosition(position: [number, number, number]) {
        const [x, y, z] = position
        const [lastX, lastY, lastZ] = this.lastPosition
        
        const distance = Math.sqrt(
            Math.pow(x - lastX, 2) + 
            Math.pow(y - lastY, 2) + 
            Math.pow(z - lastZ, 2)
        )
        
        this.metrics.distanceTraveled += distance
        this.metrics.timeAlive = (Date.now() - this.startTime) / 1000
        
        // Calculate speed
        const speed = distance * 60 // approximate speed based on frame rate
        this.speedSamples.push(speed)
        if (this.speedSamples.length > 60) {
            this.speedSamples.shift()
        }
        
        this.metrics.averageSpeed = this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length
        this.lastPosition = position
    }

    updateCheckpoints(checkpointsReached: number) {
        this.metrics.checkpointsReached = checkpointsReached
        this.currentWaypointIndex = checkpointsReached
    }

    addCollision() {
        this.metrics.collisions += 1
    }

    // Compatibility methods for AICar component
    updateSensorFitness(_readings: any) {
        // basic sensor based fitness update
    }

    getCurrentWaypointIndex(): number {
        return this.currentWaypointIndex
    }

    recordSteering(_steering: number) {
        // record steering for fitness calculation
    }

    update(position: [number, number, number], _velocity: any) {
        this.updatePosition(position)
    }

    getFitnessMetrics(): FitnessMetrics {
        return { ...this.metrics }
    }

    calculateFitness(): number {
        return calculateFitness(this.metrics)
    }

    getMetrics(): FitnessMetrics {
        return { ...this.metrics }
    }

    getFitness(): number {
        return calculateFitness(this.metrics)
    }
}