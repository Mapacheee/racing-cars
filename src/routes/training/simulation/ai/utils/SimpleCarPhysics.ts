import { Vector3 } from 'three'

// Simple physics calculations for AI cars
export class SimpleCarPhysics {
    private velocity: Vector3 = new Vector3()
    private acceleration: Vector3 = new Vector3()
    private angularVelocity: number = 0
    private maxSpeed: number = 50
    private accelerationForce: number = 30
    private friction: number = 0.95
    private position: Vector3
    private rotation: number

    constructor(position: Vector3 = new Vector3(), rotation: number = 0) {
        this.position = position
        this.rotation = rotation
    }

    // Apply AI control inputs
    applyControls(throttle: number, steering: number, brake: number = 0) {
        // Forward/backward acceleration
        const forwardForce = (throttle - brake) * this.accelerationForce
        const forwardDirection = new Vector3(
            Math.sin(this.rotation),
            0,
            Math.cos(this.rotation)
        )
        
        this.acceleration.copy(forwardDirection.multiplyScalar(forwardForce))
        
        // Steering (angular velocity)
        this.angularVelocity = steering * 2.0 * (this.velocity.length() / this.maxSpeed)
    }

    // Update physics step
    update(deltaTime: number) {
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime))
        this.velocity.multiplyScalar(this.friction)
        
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed)
        }

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime))
        this.rotation += this.angularVelocity * deltaTime
        this.acceleration.set(0, 0, 0)
    }

    getPosition(): Vector3 {
        return this.position.clone()
    }

    getRotation(): number {
        return this.rotation
    }

    getVelocity(): Vector3 {
        return this.velocity.clone()
    }

    getSpeed(): number {
        return this.velocity.length()
    }

    setPosition(position: Vector3) {
        this.position.copy(position)
    }

    setRotation(rotation: number) {
        this.rotation = rotation
    }

    reset(position: Vector3, rotation: number = 0) {
        this.position.copy(position)
        this.rotation = rotation
        this.velocity.set(0, 0, 0)
        this.acceleration.set(0, 0, 0)
        this.angularVelocity = 0
    }

    // Static utility methods for compatibility
    static getMaxSpeed(): number {
        return 50
    }

    static updateCarPhysics(rigidBody: any, controls: { throttle: number; steering: number }) {
        // Basic physics update for rigid body
        if (rigidBody && controls) {
            // Apply forces based on controls
            const force = [controls.throttle * 10, 0, 0]
            rigidBody.applyImpulse(force, true)
            
            // Apply torque for steering
            const torque = [0, controls.steering * 5, 0]
            rigidBody.applyTorqueImpulse(torque, true)
        }
    }
}