import type { JSX, ReactNode } from 'react'
import { useState, useCallback } from 'react'
import CanvasSettingsMenu from './components/CanvasSettingsMenu'
import SimulationCanvas from './components/SimulationCanvas'
import { NEATTrainingProvider } from './contexts/NEATTrainingContext'
import { CarProvider } from '../../../lib/contexts/CarContext'
import { RaceResetProvider } from '../../../lib/contexts/RaceResetContext'

function SimulatorProviders({
    children,
}: {
    children: ReactNode
}): JSX.Element {
    // Estado para forzar re-render sin recargar la página
    const [resetKey, setResetKey] = useState(0)

    const handleReset = useCallback(() => {
        console.log('🔄 Soft reset triggered')
        setResetKey((prev: number) => prev + 1)
    }, [])

    return (
        <RaceResetProvider>
            <CarProvider>
                <NEATTrainingProvider key={resetKey} onReset={handleReset}>
                    {children}
                </NEATTrainingProvider>
            </CarProvider>
        </RaceResetProvider>
    )
}

export default function TrainingSimulation(): JSX.Element {
    return (
        <SimulatorProviders>
            <div className="fixed inset-0 w-screen h-screen bg-cyan-200 z-50">
                <CanvasSettingsMenu />
                <SimulationCanvas />
            </div>
        </SimulatorProviders>
    )
}
