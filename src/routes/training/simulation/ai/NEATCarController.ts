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

    // Process sensors and get control actions - PURE AI LOGIC ONLY
    getControlActions(sensorReadings: SensorReading): NetworkOutput {
        // Pure AI behavior - no manual control interference
        const actions = this.network.activate(sensorReadings)

        let throttle = actions.throttle
        let steering = actions.steering

        // Clamp final values
        throttle = Math.max(-1, Math.min(1, throttle))
        steering = Math.max(-1, Math.min(1, steering))

        return {
            throttle,
            steering,
        }
    }

    // Apply simple car physics - same system as manual control
    applyActions(actions: NetworkOutput, rigidBody: any): void {
        if (!rigidBody) {
            console.warn('NEATCarController: No rigidBody provided')
            return
        }

        // Short delay for physics stabilization
        const elapsedTime = Date.now() - this.startTime
        if (elapsedTime < 100) {
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
