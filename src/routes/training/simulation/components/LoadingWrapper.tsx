import { useState, useEffect, useRef, type JSX } from 'react'
import LoadingScreen from './LoadingScreen'

interface LoadingWrapperProps {
    isLoading: boolean
    message?: string
    children: JSX.Element
    minimumDisplayTime?: number
}

export default function LoadingWrapper({
    isLoading,
    message,
    children,
    minimumDisplayTime = 1500, // 1.5 seconds minimum display
}: LoadingWrapperProps): JSX.Element {
    const [showLoading, setShowLoading] = useState(isLoading)
    const [isVisible, setIsVisible] = useState(isLoading)
    const loadingStartTime = useRef<number | null>(null)

    useEffect(() => {
        if (isLoading) {
            // If loading starts, show immediately and record start time
            loadingStartTime.current = Date.now()
            setShowLoading(true)
            setIsVisible(true)
        } else if (loadingStartTime.current !== null) {
            // If loading ends, check if minimum time has passed
            const elapsed = Date.now() - loadingStartTime.current
            const remainingTime = Math.max(0, minimumDisplayTime - elapsed)

            const hideLoading = () => {
                setIsVisible(false)
                // After fade animation, hide completely
                setTimeout(() => {
                    setShowLoading(false)
                    loadingStartTime.current = null
                }, 300) // 300ms fade duration
            }

            if (remainingTime > 0) {
                // Wait for remaining time before hiding
                setTimeout(hideLoading, remainingTime)
            } else {
                // Hide immediately
                hideLoading()
            }
        }
    }, [isLoading, minimumDisplayTime])

    if (!showLoading) {
        return children
    }

    return (
        <>
            {/* Loading screen with fade animation */}
            <div
                className={`absolute inset-0 z-[100] transition-opacity duration-300 ease-in-out ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <LoadingScreen message={message || 'Cargando...'} />
            </div>

            {/* Content below (hidden behind loading screen) */}
            <div
                className={
                    isVisible
                        ? 'opacity-0'
                        : 'opacity-100 transition-opacity duration-300 ease-in-out'
                }
            >
                {children}
            </div>
        </>
    )
}
