import { useEffect, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCanvasSettings } from '../../../../lib/contexts/useCanvasSettings'
import { useNEATTraining } from '../contexts/NEATTrainingContext'
import { TRACKS, regenerateMainTrack } from '../../../../lib/racing/track'
import { DEFAULT_NEAT_CONFIG } from '../ai/neat/NEATConfig'
import { useFpsCounter } from '../../../../lib/racing/hooks/useFpsCounter'

export default function CanvasSettingsMenu(): JSX.Element {
    const {
        showCollisions,
        setShowCollisions,
        showWaypoints,
        setShowWaypoints,
        showWalls,
        setShowWalls,
    } = useCanvasSettings()

    const neatContext = useNEATTraining()
    const navigate = useNavigate()
    const { fps, getFpsColor } = useFpsCounter()

    if (!neatContext) {
        return (
            <div className="absolute top-4 left-4 bg-white/90 rounded shadow-lg p-4 z-50 min-w-[250px]">
                <div className="text-red-600 text-sm">
                    Error: NEAT Context not available. Please refresh the page.
                </div>
            </div>
        )
    }

    const {
        generation,
        isTraining,
        bestFitness,
        carStates,
        startTraining,
        stopTraining,
        restartGeneration,
        evolveToNextGeneration,
    } = neatContext

    const track = TRACKS['main_circuit']

    const totalCars = DEFAULT_NEAT_CONFIG.populationSize;
    const aliveCars = totalCars - Array.from(carStates.values()).filter(car => car.isEliminated).length;

    useEffect(() => {
        document.title = 'Entrenamiento de la ia - Carrera neuronal 🏎️🧠'
    }, [])

    const handleBackToMenu = () => {
        navigate('/training/menu')
    }

    const handleGenerateNewTrack = () => {
        const seed = Math.floor(Math.random() * 1000000)

        // Use regenerateMainTrack to properly update the main circuit
        const newTrack = regenerateMainTrack(seed)
        TRACKS['current'] = newTrack
        import('../utils/TrackUpdateEvent').then(module => {
            module.trackUpdateEvents.notifyTrackUpdate()
        })
        console.log(`🔄 Generated new track with seed: ${seed}`)
    }


    return (
        <div className="absolute top-4 left-4 bg-white/90 rounded shadow-lg p-4 z-50 min-w-[250px]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-sm">
                    Control Panel
                </h3>
                <button
                    onClick={handleBackToMenu}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                    title="volver al menu"
                >
                    volver
                </button>
            </div>

            {/* Sección NEAT Training */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    🧠 NEAT Training
                </h4>

                {/* Estadísticas */}
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <div>
                        Generación:{' '}
                        <span className="font-medium">{generation}</span>
                    </div>
                    <div>
                        Carros Vivos:{' '}
                        <span className="font-medium">
                            {aliveCars}/{totalCars}
                        </span>
                    </div>
                    <div>
                        Mejor Fitness:{' '}
                        <span className="font-medium">
                            {bestFitness.toFixed(2)}
                        </span>
                    </div>

                    {/* Nueva métrica: Mejor progreso en waypoints */}
                    {Array.from(carStates.values()).length > 0 && (
                        <div>
                            Mejor Progreso:{' '}
                            <span className="font-medium text-green-600">
                                {Math.max(
                                    ...Array.from(carStates.values()).map(
                                        car =>
                                            car.metrics?.checkpointsReached || 0
                                    )
                                )}
                                /{track.waypoints.length} waypoints
                            </span>
                        </div>
                    )}

                    <div
                        className={`${isTraining ? 'text-green-600' : 'text-red-600'}`}
                    >
                        Estado: {isTraining ? 'Entrenando' : 'Detenido'}
                    </div>
                </div>

                {/* Controles */}
                <div className="space-y-2">
                    {!isTraining ? (
                        <button
                            onClick={startTraining}
                            className="w-auto px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                        >
                            Iniciar
                        </button>
                    ) : (
                        <button
                            onClick={stopTraining}
                            className="w-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                        >
                            Detener
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (isTraining) stopTraining()
                                restartGeneration()
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs transition-colors"
                            title="Reiniciar esta generación desde el principio"
                        >
                            Reiniciar
                        </button>

                        <button
                            onClick={evolveToNextGeneration}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded text-xs transition-colors"
                            title={
                                isTraining
                                    ? 'Detener entrenamiento y evolucionar'
                                    : 'Evolucionar a siguiente generación'
                            }
                        >
                            {isTraining ? 'Evolucionar' : 'Evolucionar'}
                        </button>
                    </div>
                </div>

                {/* Barra de progreso */}
                {isTraining && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">
                            Progreso Generación
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    width: `${((totalCars - aliveCars) / totalCars) * 100}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {totalCars - aliveCars} de {totalCars} eliminados
                        </div>
                    </div>
                )}

        
            </div>

            {/* Sección ajustes existente */}
            <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    ⚙️ Ajustes Visuales
                </h4>

                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-800 text-sm">
                    <input
                        type="checkbox"
                        checked={showCollisions}
                        onChange={e => setShowCollisions(e.target.checked)}
                        className="accent-cyan-600"
                    />
                    ver colisiones
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-800 text-sm">
                    <input
                        type="checkbox"
                        checked={showWaypoints}
                        onChange={e => setShowWaypoints(e.target.checked)}
                        className="accent-orange-600"
                    />
                    ver waypoints
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-800 text-sm">
                    <input
                        type="checkbox"
                        checked={showWalls}
                        onChange={e => setShowWalls(e.target.checked)}
                        className="accent-red-600"
                    />
                    ver paredes
                </label>

                <div className="border-t pt-2 mt-2">
                    <div className="text-xs text-gray-500 mb-2">
                        {track.waypoints.length} Puntos •{' '}
                        <span className={getFpsColor(fps)}>{fps}</span> FPS
                    </div>
                    <button
                        onClick={handleGenerateNewTrack}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-1 px-2 rounded text-xs transition-colors"
                        title="Generar una nueva pista con algoritmo procedural"
                    >
                        🔄 Generar Nueva Pista
                    </button>
                </div>
            </div>
        </div>
    )
}
