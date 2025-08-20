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
import { Neat, methods } from 'neataptic'
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
    neatRef: React.MutableRefObject<any>
    simulationActive: React.MutableRefObject<boolean>

    // Backend states
    isSaving: boolean
    isLoading: boolean
    isInitializing: boolean
    isResetting: boolean
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
    const [bestFitness, setBestFitness] = useState(0)
    const [isInitializing, setIsInitializing] = useState(true)
    const [isResetting, setIsResetting] = useState(false)
    const [hasInitialized, setHasInitialized] = useState(false)
    const initializationInProgress = useRef(false)

    // Backend states
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [backendError, setBackendError] = useState<string | null>(null)

    const neatRef = useRef<any>(null)
    if (!neatRef.current) {
        neatRef.current = new Neat(
            6, // número de inputs
            3, // número de outputs
            null,
            {
                mutation: methods.mutation.ALL,
                popsize: 20,
                mutationRate: 0.55,
                elitism: 3,
            }
        )
        neatRef.current.population.forEach((network: any) => {
            for (let i = 0; i < 50; i++) {
                network.mutate(
                    methods.mutation.ALL[
                        Math.floor(Math.random() * methods.mutation.ALL.length)
                    ]
                )
            }
        })
    }

    // Hook para manejar reset de la escena
    const { triggerReset } = useRaceReset()

    const aiModels = useAIModels({
        onError: error => {
            console.error('Backend error:', error.message)
            setBackendError(error.message)
        },
        onSuccess: message => {
            console.log('Backend success:', message)
            setBackendError(null)
        },
    })

    // Hook for updating player profile in background
    const { updateAiGeneration, getCurrentPlayerProfile } =
        usePlayerProfileUpdates()

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

    const evolveToNextGeneration = useCallback(async () => {
        console.log('🔥 EVOLVE BUTTON CLICKED! Current generation:', generation)

        // Save current generation before evolving
        if (aiModels.isAuthReady && carStates.size > 0) {
            try {
                console.log('💾 Saving current generation before evolution...')
                const fitnessMap = new Map<string, { fitness: number }>()
                carStates.forEach((carState, carId) => {
                    fitnessMap.set(carId, { fitness: carState.fitness })
                })
                await aiModels.saveGeneration(
                    generation,
                    neatRef.current,
                    fitnessMap
                )
            } catch (error) {
                console.warn(
                    'Failed to save generation before evolution:',
                    error
                )
            }
        }

        // 1. Asignar fitness a cada red
        const carStatesArray = Array.from(carStates.values())
        neatRef.current.population.forEach((network: any, i: number) => {
            const carState = carStatesArray[i]
            network.score = carState ? carState.fitness : 0
        })

        // 2. Evolucionar la población
        neatRef.current.evolve().then(async () => {
            const newGeneration = generation + 1
            setGeneration(newGeneration)
            setCarStates(new Map())
            setIsTraining(false)
            simulationActive.current = false

            // Update player profile with new generation
            try {
                await updateAiGeneration(newGeneration)
            } catch (profileError) {
                console.warn('Failed to update player profile:', profileError)
            }

            setTimeout(() => {
                triggerReset()
                simulationActive.current = true
                console.log(
                    `✅ Generation ${newGeneration} ready with evolved networks! Waiting for user to start training.`
                )
            }, 50)
        })
    }, [carStates, generation, triggerReset, aiModels, updateAiGeneration])

    // Backend functions
    const saveCurrentGeneration = useCallback(async () => {
        if (!aiModels.isAuthReady) {
            setBackendError('No authentication available')
            return
        }

        setIsSaving(true)
        setBackendError(null)
        try {
            console.log('📤 Saving generation to backend...')

            // Convert current car states to simple fitness map
            const fitnessMap = new Map<string, { fitness: number }>()
            carStates.forEach((carState, carId) => {
                fitnessMap.set(carId, { fitness: carState.fitness })
            })

            await aiModels.saveGeneration(
                generation,
                neatRef.current,
                fitnessMap
            )

            // Update player profile with new generation
            try {
                await updateAiGeneration(generation)
            } catch (profileError) {
                console.warn('Failed to update player profile:', profileError)
            }

            console.log('✅ Generation saved successfully')
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            setBackendError(`Failed to save generation: ${errorMessage}`)
            console.error('❌ Error saving generation:', error)
        } finally {
            setIsSaving(false)
        }
    }, [aiModels, generation, carStates, neatRef, updateAiGeneration])

    const loadLatestGeneration = useCallback(async () => {
        if (!aiModels.isAuthReady) {
            setBackendError('No authentication available')
            return
        }

        setIsLoading(true)
        setBackendError(null)
        try {
            console.log('📥 Loading latest generation from backend...')

            const response = await aiModels.loadLatestGeneration()
            if (response) {
                console.log('� Converting backend data to neataptic format...')
                const restoredNeat = await aiModels.backendToNeataptic(response)

                neatRef.current = restoredNeat
                setGeneration(response.generationNumber)

                // Reset simulation state
                setCarStates(new Map())
                setIsTraining(false)
                setBestFitness(0)
                simulationActive.current = false

                triggerReset()
                console.log(
                    `✅ Generation ${response.generationNumber} loaded successfully`
                )
            } else {
                console.log('ℹ️ No saved generations found, starting fresh')
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            setBackendError(`Failed to load generation: ${errorMessage}`)
            console.error('❌ Error loading generation:', error)
        } finally {
            setIsLoading(false)
        }
    }, [aiModels, neatRef, triggerReset])

    const loadSpecificGeneration = useCallback(
        async (generationNumber: number) => {
            if (!aiModels.isAuthReady) {
                setBackendError('No authentication available')
                return
            }

            setIsLoading(true)
            setBackendError(null)
            try {
                console.log(
                    `📥 Loading generation ${generationNumber} from backend...`
                )

                const response = await aiModels.loadGeneration(generationNumber)
                if (response) {
                    console.log(
                        '🔄 Converting backend data to neataptic format...'
                    )
                    const restoredNeat =
                        await aiModels.backendToNeataptic(response)

                    neatRef.current = restoredNeat
                    setGeneration(response.generationNumber)

                    // Reset simulation state
                    setCarStates(new Map())
                    setIsTraining(false)
                    setBestFitness(0)
                    simulationActive.current = false

                    triggerReset()
                    console.log(
                        `✅ Generation ${generationNumber} loaded successfully`
                    )
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error'
                setBackendError(
                    `Failed to load generation ${generationNumber}: ${errorMessage}`
                )
                console.error('❌ Error loading generation:', error)
            } finally {
                setIsLoading(false)
            }
        },
        [aiModels, neatRef, triggerReset]
    )

    const resetAllSavedGenerations = useCallback(async () => {
        if (!aiModels.isAuthReady) {
            setBackendError('No authentication available')
            return
        }

        setIsResetting(true)
        setBackendError(null)
        try {
            console.log('🗑️ Resetting all saved generations...')

            // Reset backend data
            await aiModels.resetAllGenerations()

            // Reset local state
            setGeneration(1)
            setCarStates(new Map())
            setBestFitness(0)
            setIsTraining(false)
            simulationActive.current = false

            // Recreate NEAT population
            neatRef.current = new Neat(
                6, // número de inputs
                3, // número de outputs
                null,
                {
                    mutation: methods.mutation.ALL,
                    popsize: 20,
                    mutationRate: 0.55,
                    elitism: 3,
                }
            )
            neatRef.current.population.forEach((network: any) => {
                for (let i = 0; i < 50; i++) {
                    network.mutate(
                        methods.mutation.ALL[
                            Math.floor(
                                Math.random() * methods.mutation.ALL.length
                            )
                        ]
                    )
                }
            })

            // Update player profile
            try {
                await updateAiGeneration(1)
            } catch (profileError) {
                console.warn('Failed to update player profile:', profileError)
            }

            triggerReset()
            console.log('✅ All generations reset successfully')
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            setBackendError(`Failed to reset generations: ${errorMessage}`)
            console.error('❌ Error resetting generations:', error)
        } finally {
            setIsResetting(false)
        }
    }, [aiModels, triggerReset, updateAiGeneration])

    const exportCurrentGeneration = useCallback(async () => {
        if (!aiModels.isAuthReady) {
            setBackendError('No authentication available')
            return
        }

        try {
            console.log('📤 Exporting current generation...')
            await aiModels.exportNetworks({ generationNumber: generation })
            console.log('✅ Generation exported successfully')
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            setBackendError(`Failed to export generation: ${errorMessage}`)
            console.error('❌ Error exporting generation:', error)
        }
    }, [aiModels, generation])

    const clearBackendError = useCallback(() => {
        setBackendError(null)
    }, [])

    // Initialize loading state
    useEffect(() => {
        if (!hasInitialized && !initializationInProgress.current) {
            initializationInProgress.current = true

            const initializeFromBackend = async () => {
                try {
                    // If authentication is ready, try to load from backend
                    if (aiModels.isAuthReady) {
                        console.log(
                            '🔄 Checking for existing AI data in backend...'
                        )

                        // Check if user has any saved generations
                        const hasExistingData =
                            await aiModels.hasAnyGenerations()

                        if (hasExistingData) {
                            console.log(
                                '📥 Found existing data, loading latest generation...'
                            )
                            const response =
                                await aiModels.loadLatestGeneration()

                            if (response) {
                                console.log(
                                    '🔄 Converting backend data to neataptic format...'
                                )
                                const restoredNeat =
                                    await aiModels.backendToNeataptic(response)

                                neatRef.current = restoredNeat
                                setGeneration(response.generationNumber)
                                console.log(
                                    `✅ Restored generation ${response.generationNumber} from backend`
                                )
                            }
                        } else {
                            console.log(
                                '🆕 No existing data found, starting with fresh population'
                            )

                            // Check current player profile and sync generation number
                            try {
                                const playerProfile =
                                    await getCurrentPlayerProfile()
                                if (
                                    playerProfile?.aiGeneration &&
                                    playerProfile.aiGeneration > 1
                                ) {
                                    setGeneration(playerProfile.aiGeneration)
                                    console.log(
                                        `🔄 Synced generation number to ${playerProfile.aiGeneration} from player profile`
                                    )
                                }
                            } catch (profileError) {
                                console.warn(
                                    'Could not sync with player profile:',
                                    profileError
                                )
                            }
                        }
                    } else {
                        console.log(
                            '⚠️ Authentication not ready, starting with fresh population'
                        )
                        if (backendError) {
                            console.warn(
                                'Backend error detected:',
                                backendError
                            )
                        }
                    }
                } catch (error) {
                    console.warn('Failed to initialize from backend:', error)
                    setBackendError('Failed to load initial data from backend')
                }

                setIsInitializing(false)
                setHasInitialized(true)
                initializationInProgress.current = false
                console.log('✅ NEAT Training Context initialized')
            }

            // Initialize after a short delay, regardless of auth status
            const timer = setTimeout(initializeFromBackend, 1000)
            return () => clearTimeout(timer)
        }

        return undefined
    }, [
        hasInitialized,
        aiModels.isAuthReady,
        aiModels,
        getCurrentPlayerProfile,
        backendError,
    ])

    // Backup initialization timeout to prevent infinite loading
    useEffect(() => {
        const backupInitTimer = setTimeout(() => {
            if (isInitializing && !hasInitialized) {
                console.warn(
                    '⚠️ Backup initialization triggered - forcing context to initialize'
                )
                setIsInitializing(false)
                setHasInitialized(true)
                initializationInProgress.current = false
            }
        }, 5000) // 5 second timeout

        return () => clearTimeout(backupInitTimer)
    }, [isInitializing, hasInitialized])

    const value: NEATTrainingContextType = {
        // Estados
        generation,
        isTraining,
        carStates,
        bestFitness,
        neatRef,
        simulationActive,

        // Backend states
        isSaving,
        isLoading,
        isInitializing,
        isResetting,
        backendError,

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
