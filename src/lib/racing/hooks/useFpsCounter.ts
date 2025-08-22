import { useEffect, useState } from 'react'

export function useFpsCounter() {
    const [fps, setFps] = useState(0)

    useEffect(() => {
        let lastTime = performance.now()
        let frameCount = 0
        let fpsInterval: number

        const updateFPS = () => {
            frameCount++
            const currentTime = performance.now()

            if (currentTime - lastTime >= 1000) {
                const currentFPS = Math.round(
                    (frameCount * 1000) / (currentTime - lastTime)
                )
                setFps(currentFPS)
                frameCount = 0
                lastTime = currentTime
            }

            fpsInterval = requestAnimationFrame(updateFPS)
        }

        fpsInterval = requestAnimationFrame(updateFPS)

        return () => {
            if (fpsInterval) {
                cancelAnimationFrame(fpsInterval)
            }
        }
    }, [])

    const getFpsColor = (fps: number) => {
        if (fps < 30) return 'text-red-400'
        if (fps < 50) return 'text-yellow-600'
        return 'text-green-500'
    }

    return { fps, getFpsColor }
}
