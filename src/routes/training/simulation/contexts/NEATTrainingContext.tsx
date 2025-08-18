import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
    type ReactNode,
    type JSX,
} from 'react'
import { Population } from '../ai/neat/Population'
import { DEFAULT_NEAT_CONFIG } from '../ai/neat/NEATConfig'
import { useRaceReset } from '../../../../lib/contexts/RaceResetContext'
import { usePlayerProfileUpdates } from '../../../../lib/hooks/usePlayerProfileUpdates'
import { useAIModels } from '../hooks/useAIModels'
import type { FitnessMetrics } from '../types/neat'

interface CarState {
    id: string
    isEliminated: boolean
    fitness: number
    metrics: FitnessMetrics
    lastUpdateTime: number
}

interface NEATTrainingContextType {
    // Estados
    generation: number
    isTraining: boolean
    carStates: Map<string, CarState>
    bestFitness: number
    population: Population
    simulationActive: React.MutableRefObject<boolean>

    // Backend states
    isSaving: boolean
    isLoading: boolean
    isInitializing: boolean
    backendError: string | null

    // Funciones
    handleFitnessUpdate: (
        carId: string,
        fitness: number,
        metrics: FitnessMetrics
    ) => void
    handleCarElimination: (carId: string) => void
    areAllCarsEliminated: () => boolean
    startTraining: () => void
    stopTraining: () => void
    restartGeneration: () => void
    evolveToNextGeneration: () => void

    // Backend functions
    saveCurrentGeneration: () => Promise<void>
    loadLatestGeneration: () => Promise<void>
    loadSpecificGeneration: (generationNumber: number) => Promise<void>
    resetAllSavedGenerations: () => Promise<void>
    exportCurrentGeneration: () => Promise<void>
    clearBackendError: () => void
}

const NEATTrainingContext = createContext<NEATTrainingContextType | null>(null)

export function useNEATTraining(): NEATTrainingContextType | null {
    const context = useContext(NEATTrainingContext)
    return context
}

export function useNEATTrainingRequired(): NEATTrainingContextType {
    const context = useContext(NEATTrainingContext)
    if (!context) {
        console.error(
            'useNEATTraining: Context is null. Component not wrapped in NEATTrainingProvider'
        )
        throw new Error(
            'useNEATTraining must be used within a NEATTrainingProvider'
        )
    }
    return context
}

interface NEATTrainingProviderProps {
    children: ReactNode
    onReset?: () => void
}

export function NEATTrainingProvider({
    children,
    onReset,
}: NEATTrainingProviderProps): JSX.Element {
    const [generation, setGeneration] = useState(1)
    const [isTraining, setIsTraining] = useState(false)
    const [carStates, setCarStates] = useState<Map<string, CarState>>(new Map())
    const [population] = useState(() => new Population(DEFAULT_NEAT_CONFIG))
    const [bestFitness, setBestFitness] = useState(0)
    const [isInitializing, setIsInitializing] = useState(true)

    const { triggerReset } = useRaceReset()

    const aiModels = useAIModels({
        onError: error => console.error('Backend error:', error.message),
        onSuccess: message => console.log('Backend success:', message),
    })

    useEffect(() => {
        console.log('@@@@ aiModels: ', aiModels)
    }, [aiModels])

    // Hook for updating player profile in background
    const { updateAiGeneration } = usePlayerProfileUpdates()

    const simulationActive = useRef(false)

    const handleFitnessUpdate = useCallback(
        (carId: string, fitness: number, metrics: FitnessMetrics) => {
            setCarStates(prev => {
                const newState = new Map(prev)
                const carState = newState.get(carId)

                if (carState) {
                    carState.fitness = fitness
                    carState.metrics = metrics
                    carState.lastUpdateTime = Date.now()
                } else {
                    newState.set(carId, {
                        id: carId,
                        isEliminated: false,
                        fitness,
                        metrics,
                        lastUpdateTime: Date.now(),
                    } as CarState)
                }

                return newState
            })

            setBestFitness(prev => Math.max(prev, fitness))
        },
        []
    )

    // Función para eliminar un carro (cuando choca)
    const handleCarElimination = useCallback((carId: string) => {
        setCarStates(prev => {
            const newState = new Map(prev)
            const carState = newState.get(carId)
            if (carState) {
                carState.isEliminated = true
                // console.log(
                //     `Car ${carId} eliminated! Fitness: ${carState.fitness.toFixed(2)}`
                // )
            }
            return newState
        })
    }, [])

    const areAllCarsEliminated = useCallback(() => {
        if (carStates.size === 0) return false
        return Array.from(carStates.values()).every(car => car.isEliminated)
    }, [carStates])

    const startTraining = useCallback(() => {
        setIsTraining(true)
        simulationActive.current = true
        console.log(`🚀 Training started for generation ${generation}`)
    }, [generation])

    const stopTraining = useCallback(() => {
        setIsTraining(false)
        simulationActive.current = false
        console.log('Training stopped')
    }, [])

    // Reiniciar generación actual
    const restartGeneration = useCallback(() => {
        console.log(`🔄 Restarting generation ${generation}`)

        setCarStates(new Map())
        setIsTraining(false)
        setBestFitness(0)
        simulationActive.current = false

        triggerReset()
        setTimeout(() => {
            simulationActive.current = true
            console.log(
                `Generation ${generation} restarted - all cars reset to starting positions`
            )
            if (onReset) {
                onReset()
            }
        }, 100)
    }, [generation, onReset, triggerReset])

    const evolveToNextGeneration = useCallback(() => {
        console.log('🔥 EVOLVE BUTTON CLICKED! Current generation:', generation)
        performEvolution()
    }, [isTraining, carStates.size, generation])

    const performEvolution = useCallback(async () => {
        const carStatesArray = Array.from(carStates.values())

        if (carStatesArray.length === 0) {
            console.warn('⚠️ No fitness data available for evolution')
            return
        }

        console.log(
            `🧬 Starting evolution with ${carStatesArray.length} cars evaluated`
        )

        carStatesArray.forEach(carState => {
            const genomes = population.getGenomes()
            const genomeIndex = parseInt(carState.id.split('-')[1]) - 1

            if (genomeIndex >= 0 && genomeIndex < genomes.length) {
                genomes[genomeIndex].fitness = carState.fitness
            }
        })

        // Save current generation before evolving
        await saveCurrentGeneration()

        population.evolve()

        const statsAfter = population.getStats()
        console.log(
            `🎉 Evolution complete! Generation ${statsAfter.generation + 1}`
        )

        const currentBest = population.getStats().bestFitness
        setBestFitness(prev => Math.max(prev, currentBest))

        const populationGen = population.getGeneration()
        const newGeneration = populationGen + 1
        console.log(
            `🔄 Setting UI generation from ${generation} to ${newGeneration}`
        )
        setGeneration(newGeneration)

        setCarStates(new Map())
        setIsTraining(false)
        simulationActive.current = false

        setTimeout(() => {
            triggerReset()
            console.log(
                `✅ Generation ${newGeneration} ready with evolved genomes! Waiting for user to start training.`
            )
        }, 50)
    }, [carStates, population, generation])

    // Backend functions
    const saveCurrentGeneration = useCallback(async () => {
        const genomes = population.getGenomes()
        const config = DEFAULT_NEAT_CONFIG

        await aiModels.saveGeneration(generation, genomes, config)

        try {
            await updateAiGeneration(generation)
        } catch (error) {
            console.warn('Failed to update player generation:', error)
        }
    }, [generation, population, aiModels, updateAiGeneration])

    const loadLatestGeneration = useCallback(async () => {
        const latestData = await aiModels.loadLatestGeneration()
        if (latestData) {
            population.loadGenomes(
                latestData.neatGenomes,
                latestData.generationNumber,
                latestData.config
            )

            setGeneration(latestData.generationNumber)
            setBestFitness(latestData.bestGenome?.fitness || 0)

            console.log(
                `📥 Loaded generation ${latestData.generationNumber} from backend with ${latestData.neatGenomes.length} genomes`
            )
        } else {
            console.log('📝 No saved generations found on server')
        }
    }, [aiModels, population])

    const loadSpecificGeneration = useCallback(
        async (generationNumber: number) => {
            const data = await aiModels.loadGeneration(generationNumber)
            if (data) {
                population.loadGenomes(
                    data.neatGenomes,
                    data.generationNumber,
                    data.config
                )

                setGeneration(data.generationNumber)
                setBestFitness(data.bestGenome?.fitness || 0)

                console.log(
                    `📥 Loaded specific generation ${generationNumber} from backend with ${data.neatGenomes.length} genomes`
                )
            }
        },
        [aiModels, population]
    )

    const resetAllSavedGenerations = useCallback(async () => {
        const success = await aiModels.resetAllGenerations()
        if (success) {
            // Reset the population to initial state
            population.resetToInitial()
            setGeneration(1)
            setBestFitness(0)
            setCarStates(new Map())

            // Save the new first generation
            const genomes = population.getGenomes()
            const config = DEFAULT_NEAT_CONFIG
            await aiModels.saveGeneration(1, genomes, config)

            // Update player's aiGeneration on server
            try {
                await updateAiGeneration(1)
            } catch (error) {
                console.warn('Failed to update player generation:', error)
            }

            console.log(
                '🗑️ All saved generations reset and new first generation created'
            )
        }
    }, [aiModels, population, updateAiGeneration])

    const exportCurrentGeneration = useCallback(async () => {
        await aiModels.exportGenomes({ generationNumber: generation })
    }, [aiModels, generation])

    const clearBackendError = useCallback(() => {
        aiModels.clearError()
    }, [aiModels])

    // Auto-load latest generation on mount or create first generation
    useEffect(() => {
        const initializeFromBackend = async () => {
            console.log('🔄 Initializing AI data from backend...')
            setIsInitializing(true)

            try {
                // Try to load latest generation from server
                const latestData = await aiModels.loadLatestGeneration()

                if (latestData) {
                    // Load existing generation
                    console.log(
                        `📥 Found existing generation ${latestData.generationNumber}, loading...`
                    )

                    population.loadGenomes(
                        latestData.neatGenomes,
                        latestData.generationNumber,
                        latestData.config
                    )

                    setGeneration(latestData.generationNumber)
                    setBestFitness(latestData.bestGenome?.fitness || 0)

                    console.log(
                        `✅ Successfully loaded generation ${latestData.generationNumber} with ${latestData.neatGenomes.length} genomes`
                    )
                } else {
                    // No saved generations, create and save the first one
                    console.log(
                        '📝 No existing generations found, creating first generation...'
                    )

                    const genomes = population.getGenomes()
                    const config = DEFAULT_NEAT_CONFIG

                    // Save the initial generation to backend
                    const savedData = await aiModels.saveGeneration(
                        1,
                        genomes,
                        config
                    )

                    if (savedData) {
                        console.log(
                            '✅ First generation created and saved to backend'
                        )
                        // Update player's aiGeneration on server
                        try {
                            await updateAiGeneration(1)
                        } catch (error) {
                            console.warn(
                                'Failed to update player generation:',
                                error
                            )
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Failed to initialize from backend:', error)
                console.log('🔄 Falling back to default initialization')
                // Fallback to default initialization if backend is not available
            } finally {
                setIsInitializing(false)
            }
        }

        initializeFromBackend()
    }, [aiModels, population, updateAiGeneration])

    const value: NEATTrainingContextType = {
        // Estados
        generation,
        isTraining,
        carStates,
        bestFitness,
        population,
        simulationActive,

        // Backend states
        isSaving: aiModels.loading,
        isLoading: aiModels.loading,
        isInitializing,
        backendError: aiModels.error,

        // Funciones
        handleFitnessUpdate,
        handleCarElimination,
        areAllCarsEliminated,
        startTraining,
        stopTraining,
        restartGeneration,
        evolveToNextGeneration,

        // Backend functions
        saveCurrentGeneration,
        loadLatestGeneration,
        loadSpecificGeneration,
        resetAllSavedGenerations,
        exportCurrentGeneration,
        clearBackendError,
    }

    return (
        <NEATTrainingContext.Provider value={value}>
            {children}
        </NEATTrainingContext.Provider>
    )
}
