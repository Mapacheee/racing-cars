import { Vector3 } from 'three'
import type { Wall } from '../../track'
import type { SensorReading, SensorConfig } from '../types'

// calculate sensor base position from car position and rotation
const calculateSensorPosition = (carPosition: Vector3, carRotation: number): Vector3 => {
    const offset = { x: 0, y: 0, z: 0 }
    return new Vector3(
        carPosition.x + Math.sin(carRotation) * offset.z + Math.cos(carRotation) * offset.x,
        carPosition.y + offset.y,
        carPosition.z + Math.cos(carRotation) * offset.z - Math.sin(carRotation) * offset.x
    )
}

// get distance reading for a single sensor direction
const getSensorDistance = (
    basePosition: Vector3,
    carRotation: number,
    sensorAngle: number,
    walls: Wall[],
    maxDistance: number
): number => {
    const sensorAngleRad = (sensorAngle * Math.PI) / 180
    const absoluteAngle = carRotation + sensorAngleRad
    const sensorEnd = new Vector3(
        basePosition.x + Math.sin(absoluteAngle) * maxDistance,
        basePosition.y,
        basePosition.z + Math.cos(absoluteAngle) * maxDistance
    )

    const distances = walls
        .map(wall => calculateWallIntersection(basePosition, sensorEnd, wall))
        .filter(distance => distance !== null)
        .map(distance => Math.min(distance! / maxDistance, 1.0))

    return distances.length > 0 ? Math.min(...distances) : 1.0
}

// Calculate intersection distance with a wall
const calculateWallIntersection = (
    sensorStart: Vector3,
    sensorEnd: Vector3,
    wall: Wall
): number | null => {
    const intersection = getLineIntersection(
        sensorStart.x,
        sensorStart.z,
        sensorEnd.x,
        sensorEnd.z,
        wall.start.x,
        wall.start.z,
        wall.end.x,
        wall.end.z
    )

    if (!intersection) return null

    return Math.sqrt(
        Math.pow(intersection.x - sensorStart.x, 2) +
        Math.pow(intersection.z - sensorStart.z, 2)
    )
}

const getLineIntersection = (
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
): { x: number; z: number } | null => {
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if (Math.abs(denominator) < 1e-10) return null

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator

    return (t >= 0 && t <= 1 && u >= 0 && u <= 1)
        ? { x: x1 + t * (x2 - x1), z: y1 + t * (y2 - y1) }
        : null
}

// main function to create sensor readings
export const createSensorReadings = (
    carPosition: Vector3,
    carRotation: number,
    walls: Wall[],
    config: SensorConfig
): SensorReading => {
    const basePosition = calculateSensorPosition(carPosition, carRotation)
    const { angles, maxDistance } = config

    return {
        left: getSensorDistance(basePosition, carRotation, angles.left, walls, maxDistance),
        leftCenter: getSensorDistance(basePosition, carRotation, angles.leftCenter, walls, maxDistance),
        center: getSensorDistance(basePosition, carRotation, angles.center, walls, maxDistance),
        rightCenter: getSensorDistance(basePosition, carRotation, angles.rightCenter, walls, maxDistance),
        right: getSensorDistance(basePosition, carRotation, angles.right, walls, maxDistance),
    }
}

// convert sensor readings to array
export const sensorReadingsToArray = (readings: SensorReading): number[] =>
    [readings.left, readings.leftCenter, readings.center, readings.rightCenter, readings.right]

// create default sensor readings
export const createDefaultSensorReadings = (): SensorReading => ({
    left: 1.0,
    leftCenter: 1.0,
    center: 1.0,
    rightCenter: 1.0,
    right: 1.0,
})
