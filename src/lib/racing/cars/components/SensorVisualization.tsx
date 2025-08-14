import { useMemo } from 'react'
import { Vector3 } from 'three'
import type { SensorReading, SensorConfig, SensorVisualizationConfig } from '../types'

interface SensorVisualizationProps {
    carPosition: Vector3
    carRotation: number
    sensorReadings: SensorReading
    config: SensorConfig
    visualConfig?: Partial<SensorVisualizationConfig>
    showCollisions?: boolean
    visible?: boolean
}

// default visualization configuration
const DEFAULT_VISUAL_CONFIG: SensorVisualizationConfig = {
    centerOffset: { x: -1, y: 0.2, z: 0 }, 
    colors: {
        noObstacle: '#00ff00',
        obstacle: '#ff0000'
    }
}

// visual representation of car sensors for debugging and display
export default function SensorVisualization({
    carPosition,
    carRotation,
    sensorReadings,
    config,
    visualConfig = {},
    showCollisions = true,
    visible = true
}: SensorVisualizationProps) {
    const finalVisualConfig = { ...DEFAULT_VISUAL_CONFIG, ...visualConfig }
    const offset = finalVisualConfig.centerOffset
    const basePosition = {
        x: carPosition.x + Math.sin(carRotation) * offset.z + Math.cos(carRotation) * offset.x,
        y: carPosition.y + offset.y,
        z: carPosition.z + Math.cos(carRotation) * offset.z - Math.sin(carRotation) * offset.x
    }


    const sensorLines = useMemo(() => {
        if (!visible) return []

        const sensors = [
            { reading: sensorReadings.left, angle: config.angles.left, key: 'left' },
            { reading: sensorReadings.leftCenter, angle: config.angles.leftCenter, key: 'leftCenter' },
            { reading: sensorReadings.center, angle: config.angles.center, key: 'center' },
            { reading: sensorReadings.rightCenter, angle: config.angles.rightCenter, key: 'rightCenter' },
            { reading: sensorReadings.right, angle: config.angles.right, key: 'right' }
        ]

        return sensors.map(sensor => {
            const sensorAngleRad = (sensor.angle * Math.PI) / 180
            const absoluteAngle = carRotation + sensorAngleRad + 90.25

            const startX = basePosition.x
            const startY = basePosition.y
            const startZ = basePosition.z

            const distance = config.maxDistance
            const endX = startX + Math.sin(absoluteAngle) * distance
            const endY = startY
            const endZ = startZ + Math.cos(absoluteAngle) * distance

            const hasObstacle = sensor.reading < 0.8
            let color = hasObstacle ? finalVisualConfig.colors.obstacle : finalVisualConfig.colors.noObstacle
            let opacity = hasObstacle ? 0.8 : 0.4
            if (!showCollisions) {
                color = '#ffffff'
                opacity = 0.0
            }
            return {
                key: sensor.key,
                start: [startX, startY, startZ] as [number, number, number],
                end: [endX, endY, endZ] as [number, number, number],
                color,
                opacity
            }
        })
    }, [carPosition, carRotation, sensorReadings, config, finalVisualConfig, visible, basePosition, showCollisions])

    if (!visible) return null

    return (
        <group>
            {sensorLines.map(line => {
                const positions = new Float32Array([
                    ...line.start,
                    ...line.end
                ])
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
                        <lineBasicMaterial color={line.color} transparent opacity={line.opacity} />
                    </line>
                )
            })}
        </group>
    )
}
