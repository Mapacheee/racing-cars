import { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useCanvasSettings } from '../../../../lib/contexts/useCanvasSettings';
import { TRACKS } from '../../../../lib/racing/track';
import {
    BaseCar3D,
    SensorVisualization,
    createSensorReadings,
    DEFAULT_SENSOR_CONFIG,
    CAR_MODELS,
    type Car3DRef,
    type AICar as AICarType,
} from '../../../../lib/racing/cars';
import {
    NEATCarController,
    CarFitnessTracker,
    GenomeBuilder,
} from '../ai';
import { DEFAULT_NEAT_CONFIG } from '../ai/neat/NEATConfig';
import type { FitnessMetrics } from '../types/neat';
import { useNEATTraining } from '../contexts/NEATTrainingContext';
import { CAR_PHYSICS_CONFIG } from '../config/physics';

interface AICarProps {
    carData: AICarType;
    onFitnessUpdate?: (
        carId: string,
        fitness: number,
        metrics: FitnessMetrics
    ) => void;
    onCarElimination?: (carId: string) => void;
    isEliminated?: boolean;
}

export default function AICar({
    carData,
    onFitnessUpdate,
    onCarElimination,
    isEliminated,
}: AICarProps) {
    const carRef = useRef<Car3DRef>(null);
    const { showCollisions } = useCanvasSettings();
    const neatContext = useNEATTraining();
    if (!neatContext) return null;
    const { isTraining, generation } = neatContext;

    // Estado local para posición y orientación
    const [carPosition, setCarPosition] = useState<Vector3>(
        new Vector3(...carData.position)
    );
    const [carHeading, setCarHeading] = useState<number>(carData.rotation || 0);
    const [quietTime, setQuietTime] = useState(0);

    // Track y controlador IA
    const track = TRACKS[carData.trackId || 'circuito 1'];
    const [controller] = useState(() => {
        const genome = carData.genome || GenomeBuilder.createMinimal(DEFAULT_NEAT_CONFIG);
        return new NEATCarController(genome, carData.id);
    });
    const [fitnessTracker] = useState(() => {
        const startPos = new Vector3(...carData.position);
        return new CarFitnessTracker(carData.id, startPos, track.waypoints);
    });

    // Reset de posición y fitness al cambiar generación o spawn
    useEffect(() => {
        if (carRef.current) {
            carRef.current.resetPosition(carData.position, [0, carData.rotation || 0, 0]);
            const startPos = new Vector3(...carData.position);
            fitnessTracker.reset(startPos);
        }
    }, [generation, carData.position, carData.rotation, fitnessTracker]);

    // Handler de colisión física con muros
    const handleCollisionEnter = (event: any) => {
        const other = event?.other || event?.colliderObject;
        if (!isEliminated && isTraining && other?.userData?.type === 'wall') {
            if (onCarElimination) onCarElimination(carData.id);
            if (carRef.current?.rigidBody) {
                carRef.current.rigidBody.setLinvel({ x: 0, y: 0, z: 0 });
                carRef.current.rigidBody.setAngvel({ x: 0, y: 0, z: 0 });
                carRef.current.rigidBody.resetForces(true);
                carRef.current.rigidBody.resetTorques(true);
            }
        }
    };

    // Ciclo principal de simulación
    useEffect(() => {
        let frame = 0;
        function updateSimulation() {
            const car = carRef.current;
            if (car?.rigidBody) {
                // Detener si está eliminado o en pausa
                if (!isTraining || isEliminated) {
                    car.rigidBody.setLinvel({ x: 0, y: 0, z: 0 });
                    car.rigidBody.setAngvel({ x: 0, y: 0, z: 0 });
                    car.rigidBody.resetForces(true);
                    car.rigidBody.resetTorques(true);
                    setQuietTime(0);
                    frame = requestAnimationFrame(updateSimulation);
                    return;
                }
                // Simulación activa
                if (track && isTraining && !isEliminated) {
                    const rb = car.rigidBody;
                    const position = rb.translation();
                    const rotation = rb.rotation();
                    const velocity = rb.linvel();
                    const heading = Math.atan2(
                        2 * (rotation.w * rotation.y + rotation.x * rotation.z),
                        1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z)
                    );
                    const newCarPosition = new Vector3(position.x, position.y, position.z);
                    setCarPosition(newCarPosition);
                    setCarHeading(heading);
                    // Sensores y fitness
                    const readings = createSensorReadings(
                        newCarPosition,
                        heading,
                        track.walls,
                        DEFAULT_SENSOR_CONFIG
                    );
                    fitnessTracker.updateSensorFitness(readings);
                        // Acciones IA
                        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                        let actions = controller.getControlActions(readings, speed);
                        // Forzar aceleración y giro neutro al inicio o si está lento
                        if (fitnessTracker.getFitnessMetrics().timeAlive < 2) {
                            actions.acceleration = 1;
                            if ('steerRight' in actions && 'steerLeft' in actions) {
                                actions.steerRight = 0;
                                actions.steerLeft = 0;
                            } else {
                                actions.steering = 0;
                            }
                        }
                        if (speed < 0.5) {
                            actions.acceleration = 1;
                            if ('steerRight' in actions && 'steerLeft' in actions) {
                                actions.steerRight = 0;
                                actions.steerLeft = 0;
                            } else {
                                actions.steering = 0;
                            }
                        }
                        controller.applyActions(actions, rb);
                    // Actualizar fitness
                    const currentPosition = new Vector3(position.x, position.y, position.z);
                    const currentVelocity = new Vector3(velocity.x, velocity.y, velocity.z);
                    fitnessTracker.update(currentPosition, currentVelocity);
                    // Eliminar si está quieto
                    if (speed < 0.1) {
                        setQuietTime(qt => {
                            const newQt = qt + 1 / 60;
                            if (newQt > 2 && onCarElimination) {
                                onCarElimination(carData.id);
                                rb.setLinvel({ x: 0, y: 0, z: 0 });
                                rb.setAngvel({ x: 0, y: 0, z: 0 });
                                rb.resetForces(true);
                                rb.resetTorques(true);
                            }
                            return newQt;
                        });
                    } else {
                        setQuietTime(0);
                    }
                    // Reporte de fitness
                    if (frame % 180 === 0 && onFitnessUpdate) {
                        const metrics = fitnessTracker.getFitnessMetrics();
                        const fitness = fitnessTracker.calculateFitness();
                        onFitnessUpdate(carData.id, fitness, metrics);
                    }
                }
            }
            frame++;
            frame = requestAnimationFrame(updateSimulation);
        }
        frame = requestAnimationFrame(updateSimulation);
        return () => cancelAnimationFrame(frame);
    }, [track, controller, fitnessTracker, carData.id, onFitnessUpdate, isEliminated, isTraining]);

    // Datos en tiempo real para renderizado y sensores
    const realTimeCarData = {
        position: carPosition,
        heading: carHeading,
    };
    const currentSensorReadings = createSensorReadings(
        realTimeCarData.position,
        realTimeCarData.heading,
        track.walls,
        DEFAULT_SENSOR_CONFIG
    );

    // Renderizado del auto y sensores
    return (
        <BaseCar3D
            ref={carRef}
            car={carData}
            modelPath={
                isEliminated && isTraining ? CAR_MODELS.eliminated : CAR_MODELS.default
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
                visualConfig={{ centerOffset: { x: -19.5, y: 0.8, z: -4.38 } }}
                showCollisions={showCollisions}
                visible={true}
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
    );
}
