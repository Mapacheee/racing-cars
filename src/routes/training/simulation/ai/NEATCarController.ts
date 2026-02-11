import { Network } from 'neataptic'
import type { Genome, NetworkOutput } from '../types/neat'
import type { SensorReading } from '../types/sensors'

// Neural network car controller
export class NeatCarController {
    private network: any
    private genome: Genome

    constructor(genome: Genome) {
        this.genome = genome
        this.network = new Network(genome)
    }

    // Get control actions from sensor inputs
    getControlActions(sensors: SensorReading, speed: number): NetworkOutput {
        const normalizedSpeed = Math.max(0, Math.min(1, speed / 25))
        
        const inputs = [
            sensors.left,
            sensors.leftCenter,
            sensors.center,
            sensors.rightCenter,
            sensors.right,
            normalizedSpeed,
        ]

        const outputs = this.network.activate(inputs) as number[]
        
        return {
            throttle: Math.max(-1, Math.min(1, outputs[0] * 2 - 1)), // -1 to 1
            steering: Math.max(-1, Math.min(1, outputs[1] - outputs[2])), // -1 to 1
        }
    }

    getGenome(): Genome {
        return this.genome
    }
}
