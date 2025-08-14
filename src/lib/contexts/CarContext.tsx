import { createContext, useContext, useState, type ReactNode } from 'react'

export type CarState = {
    speed: number
    position: [number, number, number]
    heading: number
    velocity: number
    collisions: number
    setSpeed: (speed: number) => void
    setPosition: (pos: [number, number, number]) => void
    setHeading: (heading: number) => void
    setVelocity: (velocity: number) => void
    incrementCollisions: () => void
    resetCollisions: () => void
}

const CarContext = createContext<CarState | undefined>(undefined)

export function CarProvider({ children }: { children: ReactNode }) {
    const [speed, setSpeed] = useState(0)
    const [position, setPosition] = useState<[number, number, number]>([
        0, 0, 0,
    ])
    const [heading, setHeading] = useState(0) // radians
    const [velocity, setVelocity] = useState(0)
    const [collisions, setCollisions] = useState(0)

    const incrementCollisions = () => setCollisions(c => c + 1)
    const resetCollisions = () => setCollisions(0)

    return (
        <CarContext.Provider
            value={{
                speed,
                setSpeed,
                position,
                setPosition,
                heading,
                setHeading,
                velocity,
                setVelocity,
                collisions,
                incrementCollisions,
                resetCollisions,
            }}
        >
            {children}
        </CarContext.Provider>
    )
}

export function useCar() {
    const ctx = useContext(CarContext)
    if (!ctx) throw new Error('useCar must be used within a CarProvider')
    return ctx
}
