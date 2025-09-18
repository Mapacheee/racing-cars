import {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect,
    type ReactNode,
} from 'react'
import { Neat, methods } from 'neataptic'
import { useRaceReset } from '../../../../lib/contexts/RaceResetContext'
import { usePlayerProfileUpdates } from '../../../../lib/hooks/usePlayerProfileUpdates'
import { useNEATStored } from '../hooks/useNEATStored'
import type { FitnessMetrics } from '../types/neat'

interface CarState {
    id: string
    isEliminated: boolean
    fitness: number
    metrics: FitnessMetrics
}

interface NEATTrainingContextType {
    generation: number
    isTraining: boolean
    carStates: Map<string, CarState>
    bestFitness: number
    neatRef: React.MutableRefObject<any>
    isLoading: boolean
    error: string | null

    updateCarFitness: (carId: string, fitness: number, metrics: FitnessMetrics) => void
    eliminateCar: (carId: string) => void
    areAllCarsEliminated: () => boolean
    startTraining: () => void
    stopTraining: () => void
    restartGeneration: () => void
    evolveToNextGeneration: () => void
    saveCurrentGeneration: () => Promise<void>
    loadLatestGeneration: () => Promise<void>
    resetAllGenerations: () => Promise<void>
    clearError: () => void
}

const NEATTrainingContext = createContext<NEATTrainingContextType | null>(null)

export const useNEATTraining = (): NEATTrainingContextType | null => {
    return useContext(NEATTrainingContext)
}

export const useNEATTrainingRequired = (): NEATTrainingContextType => {
    const context = useContext(NEATTrainingContext)
    if (!context) {
        throw new Error('useNEATTraining must be used within a NEATTrainingProvider')
    }
    return context
}

interface NEATTrainingProviderProps {
    children: ReactNode
    onReset?: () => void
}

// Default NEAT configuration
const DEFAULT_NEAT_CONFIG = {
    populationSize: 20,
    mutationRate: 0.55,
    elitism: 3,
    inputNodes: 6,
    outputNodes: 3,
}

// Create NEAT instance with mutations
const createNeatInstance = () => {
    const neat = new Neat(6, 3, null, {
        mutation: methods.mutation.ALL,
        popsize: DEFAULT_NEAT_CONFIG.populationSize,
        mutationRate: DEFAULT_NEAT_CONFIG.mutationRate,
        elitism: DEFAULT_NEAT_CONFIG.elitism,
    })

    neat.population.forEach((network: any) => {
        for (let i = 0; i < 50; i++) {
            network.mutate(
                methods.mutation.ALL[Math.floor(Math.random() * methods.mutation.ALL.length)]
            )
        }
    })

    return neat
}

export function NEATTrainingProvider({
    children,
    onReset,
}: NEATTrainingProviderProps) {
    const [generation, setGeneration] = useState(1)
    const [isTraining, setIsTraining] = useState(false)
    const [carStates, setCarStates] = useState<Map<string, CarState>>(new Map())
    const [bestFitness, setBestFitness] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    const neatRef = useRef<any>(null)
    const { triggerReset } = useRaceReset()
    const { updateAiGeneration } = usePlayerProfileUpdates()

    const aiModels = useNEATStored({
        onError: (err) => setError(err.message),
        onSuccess: () => setError(null),
    })

    const updateCarFitness = useCallback(
        (carId: string, fitness: number, metrics: FitnessMetrics) => {
            setCarStates(prev => {
                const newState = new Map(prev)
                const carState = newState.get(carId)

                if (carState) {
                    carState.fitness = fitness
                    carState.metrics = metrics
                } else {
                    newState.set(carId, {
                        id: carId,
                        isEliminated: false,
                        fitness,
                        metrics,
                    })
                }

                return newState
            })

            setBestFitness(prev => Math.max(prev, fitness))
        },
        []
    )

    const eliminateCar = useCallback((carId: string) => {
        setCarStates(prev => {
            const newState = new Map(prev)
            const carState = newState.get(carId)
            if (carState) {
                carState.isEliminated = true
            }
            return newState
        })
    }, [])

    const areAllCarsEliminated = useCallback(
        () => carStates.size > 0 && Array.from(carStates.values()).every(car => car.isEliminated),
        [carStates]
    )

    const startTraining = useCallback(() => {
        setIsTraining(true)
    }, [])

    const stopTraining = useCallback(() => {
        setIsTraining(false)
    }, [])

    const restartGeneration = useCallback(() => {
        setCarStates(new Map())
        setIsTraining(false)
        setBestFitness(0)
        triggerReset()
        setTimeout(() => onReset?.(), 100)
    }, [triggerReset, onReset])

    const evolveToNextGeneration = useCallback(async () => {
        if (!neatRef.current || carStates.size === 0) return

        // Apply fitness scores to population
        const carStatesArray = Array.from(carStates.values())
        neatRef.current.population.forEach((network: any, i: number) => {
            const carState = carStatesArray[i]
            network.score = carState ? carState.fitness : 0
        })

        // Evolve to next generation
        await neatRef.current.evolve()
        
        const newGeneration = generation + 1
        setGeneration(newGeneration)
        setCarStates(new Map())
        setIsTraining(false)
        setBestFitness(0)

        try {
            await updateAiGeneration(newGeneration)
        } catch (profileError) {
            console.warn('Failed to update player profile:', profileError)
        }

        setTimeout(() => {
            triggerReset()
        }, 50)
    }, [carStates, generation, triggerReset, updateAiGeneration])

    const saveCurrentGeneration = useCallback(async () => {
        if (!aiModels.isAuthReady || !neatRef.current) return

        setIsLoading(true)
        try {
            const neatExportRaw = neatRef.current.export()
            const neatExportData = typeof neatExportRaw === 'string' 
                ? JSON.parse(neatExportRaw) 
                : neatExportRaw

            await aiModels.saveGeneration(generation, neatExportData, DEFAULT_NEAT_CONFIG)
            await updateAiGeneration(generation)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(`Failed to save generation: ${errorMessage}`)
        } finally {
            setIsLoading(false)
        }
    }, [aiModels, generation, updateAiGeneration])

    const loadLatestGeneration = useCallback(async () => {
        if (!aiModels.isAuthReady) return

        setIsLoading(true)
        try {
            const response = await aiModels.loadLatestGeneration()
            if (response) {
                neatRef.current = new Neat(
                    response.neatConfig.inputNodes,
                    response.neatConfig.outputNodes,
                    null,
                    {
                        mutation: methods.mutation.ALL,
                        popsize: response.neatConfig.populationSize,
                        mutationRate: response.neatConfig.mutationRate,
                        elitism: response.neatConfig.elitism,
                    }
                )

                neatRef.current.import(response.neatExportData)
                setGeneration(response.generationNumber)
                setCarStates(new Map())
                setIsTraining(false)
                setBestFitness(0)
                triggerReset()
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(`Failed to load generation: ${errorMessage}`)
        } finally {
            setIsLoading(false)
        }
    }, [aiModels, triggerReset])

    const resetAllGenerations = useCallback(async () => {
        if (!aiModels.isAuthReady) return

        setIsLoading(true)
        try {
            await aiModels.resetAllGenerations()
            setGeneration(1)
            setCarStates(new Map())
            setBestFitness(0)
            setIsTraining(false)
            neatRef.current = createNeatInstance()
            await updateAiGeneration(1)
            triggerReset()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(`Failed to reset generations: ${errorMessage}`)
        } finally {
            setIsLoading(false)
        }
    }, [aiModels, triggerReset, updateAiGeneration])

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Initialize NEAT instance
    useEffect(() => {
        if (!isInitialized && aiModels.isAuthReady) {
            setIsInitialized(true)
            loadLatestGeneration().then(() => {
                if (!neatRef.current) {
                    neatRef.current = createNeatInstance()
                }
            })
        } else if (!neatRef.current) {
            neatRef.current = createNeatInstance()
        }
    }, [aiModels.isAuthReady, isInitialized, loadLatestGeneration])

    const value: NEATTrainingContextType = {
        generation,
        isTraining,
        carStates,
        bestFitness,
        neatRef,
        isLoading,
        error,
        updateCarFitness,
        eliminateCar,
        areAllCarsEliminated,
        startTraining,
        stopTraining,
        restartGeneration,
        evolveToNextGeneration,
        saveCurrentGeneration,
        loadLatestGeneration,
        resetAllGenerations,
        clearError,
    }

    return (
        <NEATTrainingContext.Provider value={value}>
            {children}
        </NEATTrainingContext.Provider>
    )
}
