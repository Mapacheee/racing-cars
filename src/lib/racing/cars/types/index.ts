export interface BaseCar {
    id: string
    position: [number, number, number]
    rotation?: number
    color?: string
    trackId?: string
}

export interface AiCar extends BaseCar {
    genome?: any
    networkIndex?: number
    network?: any
}

export type AICar = AiCar

export interface CarPhysicsConfig {
    mass: number
    friction: number
    restitution: number
    density: number
    angularDamping: number
    linearDamping: number
    spawnHeight: number
}

export interface CarCollisionGroups {
    car: number
    wall: number
    sensor: number
}

export interface CarControls {
    throttle: number  // 0-1 forward acceleration
    brake: number     // 0-1 braking force  
    steering: number  // -1 to 1 steering angle
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
