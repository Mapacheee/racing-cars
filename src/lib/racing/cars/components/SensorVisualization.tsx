import { useMemo, useEffect, useState } from 'react'
import { Vector3 } from 'three'
import type {
    SensorReading,
    SensorConfig,
    SensorVisualizationConfig,
} from '../types'

interface SensorVisualizationProps {
    carPosition: Vector3
    carRotation: number
    sensorReadings: SensorReading
    config: SensorConfig
    visualConfig?: Partial<SensorVisualizationConfig>
    showCollisions?: boolean
    visible?: boolean
}

const DEFAULT_COLOR_NO_OBSTACLE = '#00ff00'
const DEFAULT_COLOR_OBSTACLE = '#ff0000'

export default function SensorVisualization({
    carPosition,
    carRotation,
    sensorReadings,
    config,
    visualConfig = {},
    showCollisions = true,
    visible = true,
    walls = [],
}: SensorVisualizationProps & { walls?: any[] }) {
    const [showSensors, setShowSensors] = useState(false)
    useEffect(() => {
        setShowSensors(false)
        const timer = setTimeout(() => setShowSensors(true), 1000)
        return () => clearTimeout(timer)
    }, [])
    const basePosition = new Vector3(-0.5, 0.2, -1)

    const sensorLines = useMemo(() => {
        if (!visible) return []
        const sensors = [
            {
                reading: sensorReadings.left,
                angle: config.angles.left,
                key: 'left',
            },
            {
                reading: sensorReadings.leftCenter,
                angle: config.angles.leftCenter,
                key: 'leftCenter',
            },
            {
                reading: sensorReadings.center,
                angle: config.angles.center,
                key: 'center',
            },
            {
                reading: sensorReadings.rightCenter,
                angle: config.angles.rightCenter,
                key: 'rightCenter',
            },
            {
                reading: sensorReadings.right,
                angle: config.angles.right,
                key: 'right',
            },
        ]
        return sensors.map(sensor => {
            const sensorAngleRad = (sensor.angle * Math.PI) / 180
            const absoluteAngle = carRotation + sensorAngleRad + (49 * Math.PI) / 36   
            const start = basePosition.clone()
            const maxDistance = config.maxDistance
            const end = basePosition
                .clone()
                .add(
                    new Vector3(
                        Math.sin(absoluteAngle) * maxDistance,
                        0,
                        Math.cos(absoluteAngle) * maxDistance
                    )
                )
            let hitEnd = end
            if (walls && walls.length > 0) {
                for (const wall of walls) {
                    const denom =
                        (start.x - end.x) * (wall.start.z - wall.end.z) -
                        (start.z - end.z) * (start.x - wall.end.x)
                    if (Math.abs(denom) < 1e-10) continue
                    const t =
                        ((start.x - wall.start.x) *
                            (wall.start.z - wall.end.z) -
                            (start.z - wall.start.z) * (start.x - wall.end.x)) /
                        denom
                    const u =
                        -(
                            (start.x - end.x) * (start.z - wall.start.z) -
                            (start.z - end.z) * (start.x - wall.start.x)
                        ) / denom
                    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                        hitEnd = new Vector3(
                            start.x + t * (end.x - start.x),
                            start.y,
                            start.z + t * (end.z - start.z)
                        )
                        break
                    }
                }
            }
            const hasObstacle = sensor.reading < 0.8
            let color = hasObstacle
                ? DEFAULT_COLOR_OBSTACLE
                : DEFAULT_COLOR_NO_OBSTACLE
            let opacity = hasObstacle ? 0.8 : 0.4
            if (!showCollisions) {
                color = '#ffffff'
                opacity = 0.0
            }
            return {
                key: sensor.key,
                start: [start.x, start.y, start.z] as [number, number, number],
                end: [hitEnd.x, hitEnd.y, hitEnd.z] as [number, number, number],
                color,
                opacity,
            }
        })
    }, [
        carPosition,
        carRotation,
        sensorReadings,
        config,
        visible,
        basePosition,
        showCollisions,
        walls,
        visualConfig,
    ])

    if (!visible || !showSensors) return null

    return (
        <group>
            {sensorLines.map(line => {
                const positions = new Float32Array([...line.start, ...line.end])
                return (
                    <line key={line.key}>
                        <bufferGeometry attach="geometry">
                            <bufferAttribute
                                attach="attributes-position"
                                array={positions}
                                count={2}
                                itemSize={3}
                            />
                        </bufferGeometry>
                        <lineBasicMaterial
                            color={line.color}
                            transparent
                            opacity={line.opacity}
                        />
                    </line>
                )
            })}
        </group>
    )
}