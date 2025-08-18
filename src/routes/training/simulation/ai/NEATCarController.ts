// import type { Genome } from 'neat-javascript';

type ControlActions = {
    acceleration: number;
    steerRight: number;
    steerLeft: number;
} | {
    acceleration: number;
    steering: number;
};

import { SimpleCarPhysics } from './utils/SimpleCarPhysics';

export class NEATCarController {
    private genome: any;
    private startTime: number;
    private isControlActive: boolean;
    private carId: string;

    constructor(genome: any, carId?: string) {
        this.genome = genome;
        this.startTime = Date.now();
        this.isControlActive = false;
        this.carId = carId || '';
    }

    getControlActions(sensorReadings: any, speed: number): ControlActions {
        const maxSpeed = SimpleCarPhysics.getMaxSpeed();
        const speedNormalized = Math.max(0, Math.min(1, speed / maxSpeed));
        const inputs: number[] = [
            sensorReadings.left,
            sensorReadings.leftCenter,
            sensorReadings.center,
            sensorReadings.rightCenter,
            sensorReadings.right,
            speedNormalized,
        ];
        // neat-javascript: genome.propagate(inputs) devuelve los outputs
        const outputs = this.genome.propagate(inputs) as number[];
        const acceleration = Math.max(0, Math.min(1, outputs[0]));
        const steerRight = Math.max(0, Math.min(1, outputs[1]));
        const steerLeft = Math.max(0, Math.min(1, outputs[2]));
        return {
            acceleration,
            steerRight,
            steerLeft,
        };
    }

    applyActions(actions: ControlActions, rigidBody: any): void {
        if (!rigidBody) return;
        let steering = 0;
        if (
            typeof (actions as any).steerRight === 'number' &&
            typeof (actions as any).steerLeft === 'number'
        ) {
            steering = (actions as any).steerRight - (actions as any).steerLeft;
        } else if (typeof (actions as any).steering === 'number') {
            steering = (actions as any).steering;
        }
        const controls = {
            throttle: actions.acceleration,
            steering,
        };
        SimpleCarPhysics.updateCarPhysics(rigidBody, controls);
    }

    getGenome(): any {
        return this.genome;
    }

    isAIControlActive(): boolean {
        return this.isControlActive;
    }

    getControlDelay(): number {
        const elapsedTime = Date.now() - this.startTime;
        return Math.max(0, 100 - elapsedTime);
    }
}
