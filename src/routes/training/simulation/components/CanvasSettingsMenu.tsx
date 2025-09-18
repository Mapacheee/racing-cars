import { useEffect, useState, type JSX } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Track } from '../../../../lib/racing/track/types'
import { useNavigate } from 'react-router-dom'
import { useCanvasSettings } from '../../../../lib/contexts/useCanvasSettings'
import { useNEATTraining } from '../contexts/NEATTrainingContext'
import { TRACKS, regenerateMainTrack } from '../../../../lib/racing/track'
import { getPopulationSize } from '../ai/neat/NEATConfig'
import { useFpsCounter } from '../../../../lib/racing/hooks/useFpsCounter'

export default function CanvasSettingsMenu({
    setTrack,
}: {
    setTrack: Dispatch<SetStateAction<Track>>
}): JSX.Element {
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
    const [showRestartModal, setShowRestartModal] = useState(false)
    const [showResetAllModal, setShowResetAllModal] = useState(false)
    const [showStopModal, setShowStopModal] = useState(false)
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
        resetAllGenerations,
        isLoading,
    } = neatContext

    const track = TRACKS['main_circuit']

    const isNeatBusy = isLoading

    const totalCars = getPopulationSize()
    const aliveCars =
        totalCars -
        Array.from(carStates.values()).filter(car => car.isEliminated).length

    useEffect(() => {
        document.title = 'Entrenamiento de la ia - Carrera neuronal 🏎️🧠'
    }, [])

    const handleBackToMenu = () => {
        navigate('/training/menu')
    }

    const handleGenerateNewTrack = () => {
        const seed = Math.floor(Math.random() * 1000000)
        const newTrack = regenerateMainTrack(seed)
        setTrack(newTrack)
        import('../utils/TrackUpdateEvent').then(module => {
            module.trackUpdateEvents.notify()
        })
        console.log(`🔄 Generated new track with seed: ${seed}`)
    }

    const handleRestartConfirm = () => {
        restartGeneration()
        setShowRestartModal(false)
    }

    const handleRestartCancel = () => {
        setShowRestartModal(false)
    }

    const handleStopAndRetrain = () => {
        stopTraining()
        restartGeneration()
        setShowStopModal(false)
    }

    const handleStopAndEvolve = () => {
        stopTraining()
        evolveToNextGeneration()
        setShowStopModal(false)
    }

    const handleStopCancel = () => {
        setShowStopModal(false)
    }

    const handleResetAllConfirm = async () => {
        try {
            await resetAllGenerations()
            setShowResetAllModal(false)
            console.log('🗑️ All AI generations have been reset successfully')
        } catch (error) {
            console.error('❌ Failed to reset AI generations:', error)
        }
    }

    const handleResetAllCancel = () => {
        setShowResetAllModal(false)
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
                        className={`${
                            isNeatBusy
                                ? 'text-orange-600'
                                : isTraining
                                  ? 'text-green-600'
                                  : 'text-red-600'
                        }`}
                    >
                        Estado:{' '}
                        {isNeatBusy
                            ? 'Cargando...'
                            : isTraining
                              ? 'Entrenando'
                              : 'Detenido'}
                    </div>
                </div>

                {/* Controles */}
                <div className="space-y-2">
                    {!isTraining ? (
                        <button
                            onClick={startTraining}
                            disabled={isNeatBusy}
                            className={`w-auto px-3 py-1 text-white rounded text-xs transition-colors ${
                                isNeatBusy
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {isNeatBusy ? 'Procesando...' : 'Iniciar'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowStopModal(true)}
                            disabled={isNeatBusy}
                            className={`w-auto px-3 py-1 text-white rounded text-xs transition-colors ${
                                isNeatBusy
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
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
                            disabled={isNeatBusy}
                            className={`flex-1 text-white py-1 px-2 rounded text-xs transition-colors ${
                                isNeatBusy
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            title="Reiniciar esta generación desde el principio"
                        >
                            Reiniciar
                        </button>

                        <button
                            onClick={evolveToNextGeneration}
                            disabled={isNeatBusy}
                            className={`flex-1 text-white py-1 px-2 rounded text-xs transition-colors ${
                                isNeatBusy
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700'
                            }`}
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

                {/* Botón de empezar desde cero */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                        onClick={() => setShowResetAllModal(true)}
                        disabled={isNeatBusy}
                        className={`w-full text-white py-1 px-2 rounded text-xs transition-colors ${
                            isNeatBusy
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                    >
                        {isNeatBusy ? 'Procesando...' : 'Empezar desde cero'}
                    </button>
                </div>
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
                    <div className="text-xs font-medium text-gray-700 mb-1">
                        Pista: {track.name}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                        {track.waypoints.length} Puntos •{' '}
                        {Math.round(track.length)}m •{' '}
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

            {/* Modal de confirmación para reiniciar */}
            {showRestartModal && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            ¿Estás seguro?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            El entrenamiento de la IA va a empezar desde el
                            principio. Se perderá todo el progreso de la
                            generación actual.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleRestartCancel}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRestartConfirm}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                                Sí, reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para detener */}
            {showStopModal && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Entrenamiento detenido
                        </h3>
                        <p className="text-gray-600 mb-6">
                            ¿Qué quieres hacer con esta generación?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleStopAndRetrain}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            >
                                Entrenar de nuevo esta generación
                            </button>
                            <button
                                onClick={handleStopAndEvolve}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                            >
                                Evolucionar a la siguiente generación
                            </button>
                            <button
                                onClick={handleStopCancel}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para empezar desde cero */}
            {showResetAllModal && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            ⚠️ ¿Empezar desde cero?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Esto eliminará{' '}
                            <strong>todas las generaciones de IA</strong>{' '}
                            guardadas en el servidor y comenzará un
                            entrenamiento completamente nuevo. Esta acción{' '}
                            <strong>no se puede deshacer</strong>.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleResetAllCancel}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResetAllConfirm}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                                Sí, eliminar todo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
