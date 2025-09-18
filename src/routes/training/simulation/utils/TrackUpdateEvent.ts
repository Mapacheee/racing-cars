import { useEffect, useState } from 'react'

// Track update event system
class TrackUpdateEvents {
    private listeners = new Set<() => void>()

    addListener(listener: () => void) {
        this.listeners.add(listener)
    }

    removeListener(listener: () => void) {
        this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(listener => {
            try {
                listener()
            } catch (error) {
                console.error('Track update listener error:', error)
            }
        })
    }
}

export const trackUpdateEvents = new TrackUpdateEvents()

// Hook for track update notifications
export const useTrackUpdates = () => {
    const [updateKey, setUpdateKey] = useState(0)

    useEffect(() => {
        const listener = () => setUpdateKey((prev: number) => prev + 1)
        trackUpdateEvents.addListener(listener)
        return () => trackUpdateEvents.removeListener(listener)
    }, [])

    return updateKey
}
