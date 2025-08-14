import type { TrackGeometry } from '../../../../lib/racing/track'
import type { SensorConfig } from '../types/sensors'

export const ROAD_GEOMETRY: TrackGeometry = {
    width: 6,
    height: 0.3, // Increased significantly to avoid overlap with cars
    length: 4,
}

export const DEFAULT_SENSOR_CONFIG: SensorConfig = {
    maxDistance: 5,
    angles: {
        left: -45,
        leftCenter: -22.5,
        center: 0,
        rightCenter: 22.5,
        right: 45,
    },
}

export const TRACK_GENERATION = {
    segmentsPerSection: 40,
    wallLength: 2.0, // Increased from 1.2 to 2.0 to reduce gaps
    minimumWaypoints: 5,
}

export const CAR_MODEL_PATH = '/assets/models/raceCarRed.glb'
