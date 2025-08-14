/**
 * Track Update Event System
 * Provides a way to notify components when tracks are updated
 */

type TrackUpdateListener = () => void

class TrackUpdateEventSystem {
    private listeners: Set<TrackUpdateListener> = new Set()

    addListener(listener: TrackUpdateListener): void {
        this.listeners.add(listener)
    }

    removeListener(listener: TrackUpdateListener): void {
        this.listeners.delete(listener)
    }

    notifyTrackUpdate(): void {
        this.listeners.forEach(listener => {
            try {
                listener()
            } catch (error) {
                console.error('Error in track update listener:', error)
            }
        })
    }

    getListenerCount(): number {
        return this.listeners.size
    }
}

// Global instance
export const trackUpdateEvents = new TrackUpdateEventSystem()

// React hook to listen for track updates
import { useEffect, useState } from 'react'

export function useTrackUpdates(): number {
    const [updateKey, setUpdateKey] = useState(0)

    useEffect(() => {
        const listener = () => {
            setUpdateKey(prev => prev + 1)
        }

        trackUpdateEvents.addListener(listener)

        return () => {
            trackUpdateEvents.removeListener(listener)
        }
    }, [])

    return updateKey
}
