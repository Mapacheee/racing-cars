import { Network } from 'neataptic'
import type { Genome } from '../types/neat'

type ControlActions = {
    acceleration: number
    steerRight: number
    steerLeft: number
}

import { SimpleCarPhysics } from './utils/SimpleCarPhysics'

export class NEATCarController {
    private network: any
    private genome: Genome
    private startTime: number
    private isControlActive: boolean
    private carId: string

    constructor(genome: Genome, carId?: string) {
        this.genome = genome
        this.network = new Network(genome)
        this.startTime = Date.now()
        this.isControlActive = false
        this.carId = carId || ''
    }

    getControlActions(sensorReadings: any, speed: number): ControlActions {
        const maxSpeed = SimpleCarPhysics.getMaxSpeed()
        const speedNormalized = Math.max(0, Math.min(1, speed / maxSpeed))

        const inputs: number[] = [
            sensorReadings.left,
            sensorReadings.leftCenter,
            sensorReadings.center,
            sensorReadings.rightCenter,
            sensorReadings.right,
            speedNormalized,
        ]

        const outputs = this.network.activate(inputs) as number[]
        const acceleration = Math.max(0, Math.min(1, outputs[0]))
        const steerRight = Math.max(0, Math.min(1, outputs[1]))
        const steerLeft = Math.max(0, Math.min(1, outputs[2]))

        return {
            acceleration,
            steerRight,
            steerLeft,
        }
    }

    applyActions(actions: ControlActions, rigidBody: any): void {
        if (!rigidBody) return
        let steering = 0
        if (
            typeof (actions as any).steerRight === 'number' &&
            typeof (actions as any).steerLeft === 'number'
        ) {
            steering = (actions as any).steerRight - (actions as any).steerLeft
        } else if (typeof (actions as any).steering === 'number') {
            steering = (actions as any).steering
        }
        const controls = {
            throttle: actions.acceleration,
            steering,
        }
        SimpleCarPhysics.updateCarPhysics(rigidBody, controls)
    }

    getGenome(): Genome {
        return this.genome
    }

    getNetworkStats() {
        return {
            nodes: this.network.getNodeCount(),
            connections: this.network.getActiveConnectionCount(),
        }
    }

    isAIControlActive(): boolean {
        return this.isControlActive
    }

    getControlDelay(): number {
        const elapsedTime = Date.now() - this.startTime
        return Math.max(0, 100 - elapsedTime)
    }
}
