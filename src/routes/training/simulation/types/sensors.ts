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
}
