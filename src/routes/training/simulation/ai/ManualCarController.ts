import type { NetworkOutput } from '../types/neat'
import { globalKeyboardInput } from './utils/KeyboardInput'
import { SimpleCarPhysics, type CarControls } from './utils/SimpleCarPhysics'

/**
 * Manual Car Controller - Simple WASD control system
 */
export class ManualCarController {
    private carId: string
    private hasLoggedFirstInput: boolean = false

    constructor(carId: string) {
        this.carId = carId
        console.log(`🎮 ManualCarController created for ${carId}`)
    }

    /**
     * Get manual control actions from keyboard input
     */
    getControlActions(): NetworkOutput {
        // Only provide manual control if keyboard is active
        if (globalKeyboardInput.isActive()) {
            const keyboardActions = globalKeyboardInput.getControlActions()

            // Log the first time we receive WASD input
            if (
                globalKeyboardInput.hasActiveInput() &&
                !this.hasLoggedFirstInput
            ) {
                this.hasLoggedFirstInput = true
            }

            return keyboardActions
        }

        // No manual input - return neutral controls
        return {
            throttle: 0,
            steering: 0,
        }
    }

    /**
     * Apply manual control using simple car physics
     */
    applyActions(actions: NetworkOutput, rigidBody: any): void {
        if (!rigidBody) {
            console.warn('ManualCarController: No rigidBody provided')
            return
        }

        // Use the simple car physics system
        const controls: CarControls = {
            throttle: actions.throttle,
            steering: actions.steering,
        }

        SimpleCarPhysics.updateCarPhysics(rigidBody, controls)

        // Debug logging for active control
        if (globalKeyboardInput.hasActiveInput() && Math.random() < 0.05) {
            console.log(`🎮 Manual Control ${this.carId}:`, {
                throttle: actions.throttle.toFixed(2),
                steering: actions.steering.toFixed(2),
                speed: SimpleCarPhysics.getSpeedMagnitude(
                    rigidBody.linvel()
                ).toFixed(2),
            })
        }
    }

    isManualControlActive(): boolean {
        return globalKeyboardInput.isActive()
    }
}
