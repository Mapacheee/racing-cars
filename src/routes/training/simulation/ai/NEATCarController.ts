import { Network } from './neat/Network'
import type { Genome, NetworkOutput } from '../types/neat'
import type { SensorReading } from '../types/sensors'
import { SimpleCarPhysics, type CarControls } from './utils/SimpleCarPhysics'

export class NEATCarController {
    private network: Network
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

    getControlActions(sensorReadings: SensorReading): NetworkOutput {
        const actions = this.network.activate(sensorReadings)

        let throttle = actions.throttle
        let steering = actions.steering

        throttle = Math.max(-1, Math.min(1, throttle))
        steering = Math.max(-1, Math.min(1, steering))

        return {
            throttle,
            steering,
        }
    }

    applyActions(actions: NetworkOutput, rigidBody: any): void {
        if (!rigidBody) {
            console.warn('NEATCarController: No rigidBody provided')
            return
        }

        const elapsedTime = Date.now() - this.startTime
        if (elapsedTime < 100){
            this.isControlActive = false
            return
        }

        this.isControlActive = true

        // Use the same simple car physics system
        const controls: CarControls = {
            throttle: actions.throttle,
            steering: actions.steering,
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
