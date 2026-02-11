import type {
    CarPhysicsConfig,
    CarCollisionGroups,
    SensorConfig,
} from '../types'

export const DEFAULT_CAR_PHYSICS: CarPhysicsConfig = {
    mass: 0.8,
    friction: 0.3,
    restitution: 0.1,
    density: 1.0,
    angularDamping: 2.0,
    linearDamping: 0.08,
    spawnHeight: 0.8,
}

export const COLLISION_GROUPS: CarCollisionGroups = {
    car: 1,
    wall: 2,
    sensor: 4,
}

export const GRAVITY = [0, -9.81, 0] as const
export const DEFAULT_SENSOR_CONFIG: SensorConfig = {
    maxDistance: 4.5,
    angles: {
        left: -45,
        leftCenter: -22.5,
        center: 0,
        rightCenter: 22.5,
        right: 45,
    },
}
export const CAR_MODELS = {
    default: '/assets/models/raceCarRed.glb',
    eliminated: '/assets/models/raceCarOrange.glb',
    player: '/assets/models/raceCarBlue.glb',
} as const
export const CAR_CONTROLS = {
    maxThrottle: 1.0,
    maxBrake: 1.0,
    maxSteering: 1.0,
    steeringSpeed: 2.0,
    accelerationForce: 8.0,
    brakeForce: 12.0,
    maxSpeed: 25.0,
} as const
