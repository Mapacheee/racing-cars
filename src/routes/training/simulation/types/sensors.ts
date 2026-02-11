// Distance sensor readings (normalized 0-1)
export interface SensorReading {
    left: number
    leftCenter: number
    center: number
    rightCenter: number
    right: number
}

// Sensor configuration
export interface SensorConfig {
    maxDistance: number
    angles: {
        left: number
        leftCenter: number
        center: number
        rightCenter: number
        right: number
    }
}
