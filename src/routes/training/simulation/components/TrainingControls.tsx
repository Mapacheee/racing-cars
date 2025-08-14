import type { JSX } from 'react'

interface TrainingControlsProps {
    generation: number
    isTraining: boolean
    bestFitness: number
    aliveCars: number
    totalCars: number
    onStartTraining: () => void
    onStopTraining: () => void
    onRestartGeneration: () => void
    onEvolveGeneration: () => void
}

export default function TrainingControls({
    generation,
    isTraining,
    bestFitness,
    aliveCars,
    totalCars,
    onStartTraining,
    onStopTraining,
    onRestartGeneration,
    onEvolveGeneration
}: TrainingControlsProps): JSX.Element {
    return (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg z-10 min-w-64">
            {/* Estadísticas */}
            <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">NEAT Training</h3>
                <div className="space-y-1 text-sm">
                    <div>Generation: {generation}</div>
                    <div>Cars Alive: {aliveCars}/{totalCars}</div>
                    <div>Best Fitness: {bestFitness.toFixed(2)}</div>
                    <div className={`${isTraining ? 'text-green-400' : 'text-red-400'}`}>
                        Status: {isTraining ? 'Training' : 'Stopped'}
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div className="space-y-2">
                {!isTraining ? (
                    <button
                        onClick={onStartTraining}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                    >
                        Start Training
                    </button>
                ) : (
                    <button
                        onClick={onStopTraining}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                    >
                        Stop Training
                    </button>
                )}

                <button
                    onClick={onRestartGeneration}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                    disabled={!isTraining}
                >
                    Restart Generation
                </button>

                <button
                    onClick={onEvolveGeneration}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
                    disabled={!isTraining}
                >
                    Evolve Generation
                </button>
            </div>

            {/* Indicador de progreso */}
            {isTraining && (
                <div className="mt-4">
                    <div className="text-xs text-gray-300 mb-1">Generation Progress</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((totalCars - aliveCars) / totalCars) * 100}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        {totalCars - aliveCars} of {totalCars} eliminated
                    </div>
                </div>
            )}
        </div>
    )
}
