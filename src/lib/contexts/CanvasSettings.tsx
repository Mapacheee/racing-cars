import React, { createContext, useState, type ReactNode } from 'react'

export interface CanvasSettings {
    showCollisions: boolean
    setShowCollisions: (value: boolean) => void
    showWaypoints: boolean
    setShowWaypoints: (value: boolean) => void
    showWalls: boolean
    setShowWalls: (value: boolean) => void
}

export const CanvasSettingsContext = createContext<CanvasSettings | undefined>(
    undefined
)

export function CanvasSettingsProvider({ children }: { children: ReactNode }) {
    const [showCollisions, setShowCollisions] = useState(false)
    const [showWaypoints, setShowWaypoints] = useState(true)
    const [showWalls, setShowWalls] = useState(true)

    const value = React.useMemo(
        () => ({
            showCollisions,
            setShowCollisions,
            showWaypoints,
            setShowWaypoints,
            showWalls,
            setShowWalls,
        }),
        [showCollisions, showWaypoints, showWalls]
    )

    return (
        <CanvasSettingsContext.Provider value={value}>
            {children}
        </CanvasSettingsContext.Provider>
    )
}
