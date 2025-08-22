export interface BaseCar {
    id: string
    position: [number, number, number]
    rotation?: number
    color?: string
    trackId?: string
}

export interface AICar extends BaseCar {
    genome?: any
}

export interface CarPhysicsConfig {
    angularDamping: number
    linearDamping: number
    spawnHeight: number
    mass?: number
    friction?: number
    restitution?: number
    collisionFilterGroup?: number
    collisionFilterMask?: number
}

export interface CarCollisionGroups {
    cars: number
    walls: number
    track: number
}

export interface CarControls {
    throttle: number // 0-1 forward acceleration
    brake: number // 0-1 braking force
    steering: number // -1 to 1 steering angle
}

export interface CarState {
    position: [number, number, number]
    rotation: [number, number, number]
    velocity: [number, number, number]
    angularVelocity: [number, number, number]
    controls: CarControls
}

export interface SensorReading {
    left: number
    leftCenter: number
    center: number
    rightCenter: number
    right: number
}

export interface SensorAngles {
    left: number
    leftCenter: number
    center: number
    rightCenter: number
    right: number
}

export interface SensorConfig {
    maxDistance: number
    angles: SensorAngles
}

export interface SensorVisualizationConfig {
    centerOffset: {
        x: number
        y: number
        z: number
    }
    colors: {
        noObstacle: string
        obstacle: string
    }
    sensorAngleOffset?: number
}
