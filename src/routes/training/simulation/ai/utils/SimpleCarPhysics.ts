/**
 * Simexport class SimpleCarPhysics {
    // Physics constants - tuned to overcome ground friction
    private static readonly MAX_SPEED = 25.0
    private static readonly ACCELERATION = 20.0  // High acceleration to overcome friction
    private static readonly DECELERATION = 10.0
    private static readonly TURN_SPEED = 4.0
    private static readonly MIN_TURN_SPEED = 0.5  // Allow turning at very low speeds reliable car physics system
 * Supports both AI and manual control with the same physics
 */

export interface CarControls {
    throttle: number // -1 to 1 (negative = reverse)
    steering: number // -1 to 1 (negative = left, positive = right)
}

export class SimpleCarPhysics {
    private static readonly MAX_SPEED = 6
    private static readonly ACCELERATION = 1
    private static readonly DECELERATION = 1
    private static readonly TURN_SPEED = 2
    private static readonly MIN_TURN_SPEED = 1

    static getMaxSpeed(): number {
        return SimpleCarPhysics.MAX_SPEED
    }

    static updateCarPhysics(
        rigidBody: any,
        controls: CarControls,
        deltaTime: number = 1 / 60
    ): void {
        if (!rigidBody) {
            console.warn('SimpleCarPhysics: No rigid body provided')
            return
        }

        const position = rigidBody.translation()
        const rotation = rigidBody.rotation()
        const velocity = rigidBody.linvel()

        if (position.y < -5) {
            console.log('🚨 Car fell through ground! Resetting...')
            rigidBody.setTranslation(
                { x: position.x, y: 1.0, z: position.z },
                true
            )
            rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true)
            rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
            return
        }

        const forward = this.getForwardDirection(rotation)
        const right = { x: forward.z, z: -forward.x } // Perpendicular to forward

        const currentSpeed = this.getForwardSpeed(velocity, forward)
        const sidewaysSpeed = velocity.x * right.x + velocity.z * right.z

        let targetSpeed = currentSpeed
        const { throttle, steering } = controls

        if (Math.abs(throttle) > 0.1) {
            if (throttle > 0) {
                targetSpeed = Math.min(
                    currentSpeed + this.ACCELERATION * throttle * deltaTime,
                    this.MAX_SPEED
                )
            } else {
                if (currentSpeed > 0) {
                    targetSpeed = Math.max(
                        currentSpeed + this.DECELERATION * throttle * deltaTime,
                        0
                    )
                } else {
                    targetSpeed = Math.max(
                        currentSpeed + this.ACCELERATION * throttle * deltaTime,
                        -this.MAX_SPEED * 0.6
                    )
                }
            }
        } else {
            const deceleration =
                currentSpeed > 0
                    ? -this.DECELERATION * 0.3
                    : this.DECELERATION * 0.3
            targetSpeed = currentSpeed + deceleration * deltaTime

            if (Math.abs(targetSpeed) < 0.5) {
                targetSpeed = 0
            }
        }

        let angularVelocity = 0

        if (
            Math.abs(steering) > 0.1 &&
            Math.abs(currentSpeed) > this.MIN_TURN_SPEED
        ) {
            const speedFactor = Math.min(Math.abs(currentSpeed) / 10.0, 1.0)
            angularVelocity = steering * this.TURN_SPEED * speedFactor

            if (currentSpeed < 0) {
                angularVelocity *= -1
            }
        }

        const newVelocity = {
            x: forward.x * targetSpeed + right.x * sidewaysSpeed * 0.1,
            y: velocity.y,
            z: forward.z * targetSpeed + right.z * sidewaysSpeed * 0.1,
        }

        try {
            const currentVel = rigidBody.linvel()
            const forceMagnitude = 25.0 // Force strength (aumentado para mayor respuesta)

            const forceX = (newVelocity.x - currentVel.x) * forceMagnitude
            const forceZ = (newVelocity.z - currentVel.z) * forceMagnitude

            // Apply force at car's center of mass
            rigidBody.addForce({ x: forceX, y: 0, z: forceZ }, true)

            // Still set angular velocity directly for responsive steering
            rigidBody.setAngvel({ x: 0, y: angularVelocity, z: 0 }, true)
        } catch (error) {
            console.error('🚨 Error applying physics to rigid body:', error)
        }
    }

    private static getForwardDirection(rotation: any): {
        x: number
        z: number
    } {
        const { x, y, z, w } = rotation

        const yAngle = Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + z * z))

        return {
            x: Math.sin(yAngle),
            z: Math.cos(yAngle),
        }
    }

    private static getForwardSpeed(
        velocity: any,
        forward: { x: number; z: number }
    ): number {
        return velocity.x * forward.x + velocity.z * forward.z
    }

    static getSpeedMagnitude(velocity: any): number {
        return Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
    }
}
