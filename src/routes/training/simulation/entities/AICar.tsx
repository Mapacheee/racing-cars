import { useRef, useEffect, useState } from 'react'
import { Vector3 } from 'three'
import { useCanvasSettings } from '../../../../lib/contexts/useCanvasSettings'
import { TRACKS } from '../../../../lib/racing/track'
import {
    BaseCar3D,
    SensorVisualization,
    createSensorReadings,
    DEFAULT_SENSOR_CONFIG,
    CAR_MODELS,
    type Car3DRef,
    type AICar as AICarType,
} from '../../../../lib/racing/cars'
import { CarFitnessTracker } from '../ai'
import type { FitnessMetrics } from '../types/neat'
import { useNEATTraining } from '../contexts/NEATTrainingContext'
import { CAR_PHYSICS_CONFIG } from '../config/physics'
import { SimpleCarPhysics } from '../ai/utils/SimpleCarPhysics'
import { Network } from 'neataptic'

interface AICarProps {
    carData: AICarType
    onFitnessUpdate?: (
        carId: string,
        fitness: number,
        metrics: FitnessMetrics
    ) => void
    onCarElimination?: (carId: string) => void
    isEliminated?: boolean
}

export default function AICar({
    carData,
    onFitnessUpdate,
    onCarElimination,
    isEliminated,
}: AICarProps) {
    const carRef = useRef<Car3DRef>(null)
    const { showCollisions } = useCanvasSettings()
    const neatContext = useNEATTraining()

    // State declarations - must be called before any conditional logic
    const [carPosition, setCarPosition] = useState<Vector3>(
        new Vector3(...carData.position)
    )
    const [carHeading, setCarHeading] = useState<number>(carData.rotation || 0)
    const [quietTime, setQuietTime] = useState(0)

    // Check if NEAT context is ready
    const isNeatReady = neatContext && neatContext.neatRef?.current

    // Only destructure if context exists
    const { isTraining, neatRef } = neatContext || {}

    const track = TRACKS[carData.trackId || 'circuito 1']

    let neatNetwork: any = null
    if (isNeatReady) {
        if (carData.genome) {
            neatNetwork = Network.fromJSON(carData.genome)
        } else {
            neatNetwork =
                neatRef?.current?.population[
                    parseInt(carData.id) %
                        (neatRef.current.population?.length || 1)
                ]
        }
    }

    const [fitnessTracker, setFitnessTracker] = useState(() => {
        const startPos = new Vector3(...carData.position)
        return new CarFitnessTracker(carData.id, startPos, track.waypoints)
    })

    useEffect(() => {
        const startPos = new Vector3(...carData.position)
        setFitnessTracker(
            new CarFitnessTracker(carData.id, startPos, track.waypoints)
        )
    }, [track.waypoints])

    useEffect(() => {
        const startPos = new Vector3(...carData.position)
        setCarPosition(startPos)
        setCarHeading(carData.rotation || 0)
        if (carRef.current) {
            carRef.current.resetPosition(carData.position, [
                0,
                carData.rotation || 0,
                0,
            ])
            fitnessTracker.reset(startPos)
        }
    }, [carData.position, carData.rotation, track, fitnessTracker])

    // Handler de colisión física con muros
    const handleCollisionEnter = (_event: any) => {
        if (!isEliminated && isTraining) {
            if (onCarElimination) onCarElimination(carData.id)
            if (carRef.current?.rigidBody) {
                carRef.current.rigidBody.setLinvel({ x: 0, y: 0, z: 0 })
                carRef.current.rigidBody.setAngvel({ x: 0, y: 0, z: 0 })
                carRef.current.rigidBody.resetForces(true)
                carRef.current.rigidBody.resetTorques(true)
            }
        }
    }

    useEffect(() => {
        let frame = 0
        function updateSimulation() {
            const car = carRef.current
            if (car?.rigidBody) {
                if (!isTraining || isEliminated) {
                    car.rigidBody.setLinvel({ x: 0, y: 0, z: 0 })
                    car.rigidBody.setAngvel({ x: 0, y: 0, z: 0 })
                    car.rigidBody.resetForces(true)
                    car.rigidBody.resetTorques(true)
                    setQuietTime(0)
                    frame = requestAnimationFrame(updateSimulation)
                    return
                }
                if (track && isTraining && !isEliminated) {
                    const rb = car.rigidBody
                    const position = rb.translation()
                    const rotation = rb.rotation()
                    const velocity = rb.linvel()
                    const heading = Math.atan2(
                        2 * (rotation.w * rotation.y + rotation.x * rotation.z),
                        1 -
                            2 *
                                (rotation.y * rotation.y +
                                    rotation.z * rotation.z)
                    )
                    const newCarPosition = new Vector3(
                        position.x,
                        position.y,
                        position.z
                    )
                    setCarPosition(newCarPosition)
                    setCarHeading(heading)

                    const readings = createSensorReadings(
                        newCarPosition,
                        heading,
                        track.walls,
                        DEFAULT_SENSOR_CONFIG
                    )
                    ;(
                        [
                            'left',
                            'leftCenter',
                            'center',
                            'rightCenter',
                            'right',
                        ] as const
                    ).forEach(key => {
                        readings[key] = Math.max(0, Math.min(1, readings[key]))
                    })
                    fitnessTracker.updateSensorFitness(readings)

                    let angleToWaypoint = 0
                    const currentIdx = fitnessTracker.getCurrentWaypointIndex()
                    if (track.waypoints) {
                        const nextIdx = Math.min(
                            currentIdx,
                            track.waypoints.length - 1
                        )
                        const nextWaypoint = track.waypoints[nextIdx]
                        if (nextWaypoint) {
                            const dx = nextWaypoint.x - newCarPosition.x
                            const dz = nextWaypoint.z - newCarPosition.z
                            angleToWaypoint = Math.atan2(dx, dz) - heading
                            angleToWaypoint = Math.atan2(
                                Math.sin(angleToWaypoint),
                                Math.cos(angleToWaypoint)
                            )
                        }
                    }

                    const speed = Math.sqrt(
                        velocity.x * velocity.x + velocity.z * velocity.z
                    )
                    const inputs = [
                        readings.left,
                        readings.leftCenter,
                        readings.center,
                        readings.rightCenter,
                        readings.right,
                        speed,
                    ]
                    let acceleration = 0,
                        steerRight = 0,
                        steerLeft = 0,
                        steering = 0
                    if (
                        neatNetwork &&
                        typeof neatNetwork.activate === 'function'
                    ) {
                        const outputs = neatNetwork.activate(inputs)
                        acceleration = Math.max(0, Math.min(1, outputs[0]))
                        steerRight = Math.max(0, Math.min(1, outputs[1]))
                        steerLeft = Math.max(0, Math.min(1, outputs[2]))
                        steering = steerRight - steerLeft
                    } else {
                        acceleration = 0
                        steering = 0
                    }
                    if (car?.rigidBody) {
                        const controls = {
                            throttle:
                                acceleration * SimpleCarPhysics.getMaxSpeed(),
                            steering,
                        }
                        SimpleCarPhysics.updateCarPhysics(
                            car.rigidBody,
                            controls
                        )
                    }
                    fitnessTracker.recordSteering(steering)
                    const currentPosition = new Vector3(
                        position.x,
                        position.y,
                        position.z
                    )
                    const currentVelocity = new Vector3(
                        velocity.x,
                        velocity.y,
                        velocity.z
                    )
                    fitnessTracker.update(currentPosition, currentVelocity)

                    if (velocity.z < -0.05) {
                        fitnessTracker.recordSteering(-Math.abs(velocity.z))
                    }
                    if (Math.abs(steering) > 0.8) {
                        fitnessTracker.recordSteering(-Math.abs(steering) * 0.5)
                    }

                    if (speed < 0.1) {
                        setQuietTime(qt => {
                            const newQt = qt + 1 / 60
                            if (newQt > 2 && onCarElimination) {
                                onCarElimination(carData.id)
                                rb.setLinvel({ x: 0, y: 0, z: 0 })
                                rb.setAngvel({ x: 0, y: 0, z: 0 })
                                rb.resetForces(true)
                                rb.resetTorques(true)
                            }
                            return newQt
                        })
                    } else {
                        setQuietTime(0)
                    }

                    if (frame % 180 === 0 && onFitnessUpdate) {
                        const metrics = fitnessTracker.getFitnessMetrics()
                        const fitness = fitnessTracker.calculateFitness()
                        onFitnessUpdate(carData.id, fitness, metrics)
                    }
                }
            }
            frame++
            frame = requestAnimationFrame(updateSimulation)
        }
        frame = requestAnimationFrame(updateSimulation)
        return () => cancelAnimationFrame(frame)
    }, [
        track,
        fitnessTracker,
        carData.id,
        onFitnessUpdate,
        isEliminated,
        isTraining,
    ])

    // Datos en tiempo real para renderizado y sensores
    const realTimeCarData = {
        position: carPosition,
        heading: carHeading,
    }
    const currentSensorReadings = createSensorReadings(
        realTimeCarData.position,
        realTimeCarData.heading,
        track.walls,
        DEFAULT_SENSOR_CONFIG
    )

    const sensorAngleOffset = 2 * Math.PI - (carData.rotation || 0)

    // Renderizado del auto y sensores
    // Don't render if NEAT is not ready to prevent hooks violations
    if (!isNeatReady) {
        return null
    }

    return (
        <BaseCar3D
            ref={carRef}
            car={carData}
            modelPath={
                isEliminated && isTraining
                    ? CAR_MODELS.eliminated
                    : CAR_MODELS.default
            }
            physics={{
                mass: 1.0,
                friction: 1.5,
                restitution: 0.1,
                angularDamping: CAR_PHYSICS_CONFIG.angularDamping,
                linearDamping: CAR_PHYSICS_CONFIG.linearDamping,
                collisionFilterGroup: 0,
                collisionFilterMask: 0,
            }}
            onCollisionEnter={handleCollisionEnter}
        >
            <SensorVisualization
                carPosition={realTimeCarData.position}
                carRotation={realTimeCarData.heading}
                sensorReadings={currentSensorReadings}
                config={DEFAULT_SENSOR_CONFIG}
                showCollisions={showCollisions}
                visible={true}
                visualConfig={{ sensorAngleOffset }}
            />
            {showCollisions && (
                <mesh position={[-0.5, 0.2, -1]}>
                    <boxGeometry args={[1, 0.4, 2]} />
                    <meshBasicMaterial
                        color={carData.color || 'blue'}
                        wireframe
                        transparent
                        opacity={0.5}
                    />
                </mesh>
            )}
        </BaseCar3D>
    )
}
