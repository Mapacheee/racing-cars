import type { JSX, ReactNode } from 'react'
import { TRACKS } from '../../../lib/racing/track'
import type { Track } from '../../../lib/racing/track/types'
import { useState, useCallback } from 'react'
import CanvasSettingsMenu from './components/CanvasSettingsMenu'
import SimulationCanvas from './components/SimulationCanvas'
// import LoadingScreen from './components/LoadingScreen'
// import LoadingWrapper from './components/LoadingWrapper'
import {
    NEATTrainingProvider,
    // useNEATTraining,
} from './contexts/NEATTrainingContext'
import { CarProvider } from '../../../lib/contexts/CarContext'
import { RaceResetProvider } from '../../../lib/contexts/RaceResetContext'

// function SimulationContent(): JSX.Element {
//     const neatContext = useNEATTraining()

//     if (!neatContext) {
//         return <LoadingScreen message="Inicializando contexto NEAT..." />
//     }

//     const { isInitializing, isResetting } = neatContext

//     return (
//         <LoadingWrapper
//             isLoading={isInitializing || isResetting}
//             message={
//                 isResetting
//                     ? 'Reseteando todas las generaciones y creando nueva...'
//                     : 'Cargando datos de entrenamiento desde el servidor...'
//             }
//             minimumDisplayTime={isResetting ? 2000 : 1500} // Longer display for reset
//         >
//             <>
//                 <CanvasSettingsMenu />
//                 <SimulationCanvas />
//             </>
//         </LoadingWrapper>
//     )
// }

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
    const [track, setTrack] = useState<Track>(
        () => TRACKS['current'] || TRACKS['main_circuit']
    )
    return (
        <SimulatorProviders>
            <div className="fixed inset-0 w-screen h-screen bg-cyan-200 z-50">
                <CanvasSettingsMenu setTrack={setTrack} />
                <SimulationCanvas track={track} />
            </div>
        </SimulatorProviders>
    )
}
