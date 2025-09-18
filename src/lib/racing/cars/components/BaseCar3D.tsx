import { useGLTF } from '@react-three/drei'
import { RigidBody, interactionGroups } from '@react-three/rapier'
import {
    useRef,
    forwardRef,
    useImperativeHandle,
    useCallback,
    useState,
    useEffect,
} from 'react'
import type { ReactNode } from 'react'
import type { BaseCar, CarPhysicsConfig } from '../types'
import { DEFAULT_CAR_PHYSICS, COLLISION_GROUPS, CAR_MODELS } from '../config'

interface BaseCar3DProps {
    car: BaseCar
    physics?: Partial<CarPhysicsConfig>
    modelPath?: string
    visible?: boolean
    children?: ReactNode
    onCollision?: (event: any) => void
    onCollisionEnter?: (event: any) => void
}

export interface Car3DRef {
    rigidBody: any
    getPosition: () => [number, number, number]
    getRotation: () => [number, number, number]
    getVelocity: () => [number, number, number]
    applyForce: (force: [number, number, number]) => void
    applyTorque: (torque: [number, number, number]) => void
    resetPosition: (
        position: [number, number, number],
        rotation?: [number, number, number]
    ) => void
}

const BaseCar3D = forwardRef<Car3DRef, BaseCar3DProps>(
    (
        {
            car,
            physics = {},
            modelPath,
            visible = true,
            children,
            onCollision,
            onCollisionEnter,
        },
        ref
    ) => {
        const rigidBodyRef = useRef<any>(null)
        const finalPhysics = { ...DEFAULT_CAR_PHYSICS, ...physics }
        const finalModelPath = modelPath || CAR_MODELS.default

        const { scene } = useGLTF(finalModelPath)

        const [bodyType, setBodyType] = useState<
            'dynamic' | 'kinematicPosition'
        >('dynamic')

        useEffect(() => {
            setBodyType('kinematicPosition')
            const timeout = setTimeout(() => {
                setBodyType('dynamic')
            }, 1000)
            return () => clearTimeout(timeout)
        }, [car.position, car.rotation])

        useEffect(() => {
            const body = rigidBodyRef.current
            if (
                body &&
                typeof body.setCollisionGroups === 'function' &&
                typeof body.setSolverGroups === 'function'
            ) {
                body.setCollisionGroups(
                    interactionGroups(COLLISION_GROUPS.car, [
                        COLLISION_GROUPS.wall,
                        COLLISION_GROUPS.sensor,
                    ])
                )
                body.setSolverGroups(
                    interactionGroups(COLLISION_GROUPS.car, [
                        COLLISION_GROUPS.wall,
                        COLLISION_GROUPS.sensor,
                    ])
                )
            }
        }, [bodyType])

        const setRigidBodyRef = useCallback(
            (rigidBody: any) => {
                rigidBodyRef.current = rigidBody

                if (ref && typeof ref === 'object' && ref.current) {
                    ref.current.rigidBody = rigidBody
                }
            },
            [ref]
        )

        useImperativeHandle(
            ref,
            () => ({
                rigidBody: rigidBodyRef.current,
                getPosition: () => {
                    if (!rigidBodyRef.current) return [0, 0, 0]
                    const pos = rigidBodyRef.current.translation()
                    return [pos.x, pos.y, pos.z]
                },
                getRotation: () => {
                    if (!rigidBodyRef.current) return [0, 0, 0]
                    const rot = rigidBodyRef.current.rotation()
                    return [rot.x, rot.y, rot.z]
                },
                getVelocity: () => {
                    if (!rigidBodyRef.current) return [0, 0, 0]
                    const vel = rigidBodyRef.current.linvel()
                    return [vel.x, vel.y, vel.z]
                },
                applyForce: (force: [number, number, number]) => {
                    if (rigidBodyRef.current) {
                        rigidBodyRef.current.addForce(
                            { x: force[0], y: force[1], z: force[2] },
                            true
                        )
                    }
                },
                applyTorque: (torque: [number, number, number]) => {
                    if (rigidBodyRef.current) {
                        rigidBodyRef.current.addTorque(
                            { x: torque[0], y: torque[1], z: torque[2] },
                            true
                        )
                    }
                },
                resetPosition: (
                    position: [number, number, number],
                    rotation?: [number, number, number]
                ) => {
                    if (rigidBodyRef.current) {
                        rigidBodyRef.current.setTranslation(
                            { x: position[0], y: position[1], z: position[2] },
                            true
                        )
                        if (rotation) {
                            rigidBodyRef.current.setRotation(
                                {
                                    x: rotation[0],
                                    y: rotation[1],
                                    z: rotation[2],
                                    w: 1,
                                },
                                true
                            )
                        }
                    }
                },
            }),
            []
        )

        if (!visible) return null

        const isAICar = 'genome' in car
        const carCollisionGroups = isAICar
            ? interactionGroups(COLLISION_GROUPS.car, [
                  COLLISION_GROUPS.wall,
                  COLLISION_GROUPS.sensor,
              ])
            : interactionGroups(COLLISION_GROUPS.car, [
                  COLLISION_GROUPS.car,
                  COLLISION_GROUPS.wall,
                  COLLISION_GROUPS.sensor,
              ])
        const carSolverGroups = carCollisionGroups
        return (
            <RigidBody
                ref={setRigidBodyRef}
                type={bodyType}
                position={car.position}
                rotation={
                    car.rotation ? [0, car.rotation + Math.PI, 0] : [0, 0, 0]
                }
                angularDamping={finalPhysics.angularDamping}
                linearDamping={finalPhysics.linearDamping}
                mass={finalPhysics.mass || 1.0}
                friction={0.3}
                restitution={finalPhysics.restitution || 0.1}
                colliders="cuboid"
                canSleep={false}
                enabledRotations={[false, true, false]}
                ccd={true}
                gravityScale={1.0}
                collisionGroups={carCollisionGroups}
                solverGroups={carSolverGroups}
                userData={{ type: 'car', id: car.id }}
                {...(onCollision && { onCollisionEnter: onCollision })}
                {...(typeof onCollisionEnter === 'function' && {
                    onCollisionEnter,
                })}
            >
                <primitive
                    object={scene.clone()}
                    scale={1.5}
                    {...(car.color && {
                        material: { color: car.color },
                    })}
                />
                {children}
            </RigidBody>
        )
    }
)

BaseCar3D.displayName = 'BaseCar3D'

export default BaseCar3D
