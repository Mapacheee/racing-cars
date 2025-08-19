// shared car types for racing system
export interface BaseCar {
    id: string
    position: [number, number, number]
    rotation?: number
    color?: string
    trackId?: string
}

// car specific to AI training (extends BaseCar with AI-specific data)
export interface AICar extends BaseCar {
    genome?: any  // NEAT genome for AI training - kept as any to avoid NEAT dependency in shared lib
}

// car physics and collision configuration
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

// car control and movement
export interface CarControls {
    throttle: number    // 0-1 forward acceleration
    brake: number      // 0-1 braking force  
    steering: number   // -1 to 1 steering angle
}

export interface CarState {
    position: [number, number, number]
    rotation: [number, number, number]
    velocity: [number, number, number]
    angularVelocity: [number, number, number]
    controls: CarControls
}

// sensor system for collision detection and AI input
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
    sensorAngleOffset?: number;
}
