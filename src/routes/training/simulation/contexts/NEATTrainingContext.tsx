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
import { useNEATStored } from '../hooks/useNEATStored'
import type { FitnessMetrics } from '../types/neat'

interface CarState {
    id: string
    isEliminated: boolean
    fitness: number
    metrics: FitnessMetrics
    lastUpdateTime: number
}

interface NEATTrainingContextType {
    generation: number
    isTraining: boolean
    carStates: Map<string, CarState>
    bestFitness: number
    neatRef: React.MutableRefObject<any>
    simulationActive: React.MutableRefObject<boolean>

    isSaving: boolean
    isLoading: boolean
    isInitializing: boolean
    isResetting: boolean
    backendError: string | null

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
    restartFromCurrentGeneration: () => void
    evolveToNextGeneration: () => void

    saveCurrentGeneration: () => Promise<void>
    loadLatestGeneration: () => Promise<void>
    loadSpecificGeneration: (generationNumber: number) => Promise<void>
    resetAllSavedGenerations: () => Promise<void>
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

    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [backendError, setBackendError] = useState<string | null>(null)

    const neatRef = useRef<any>(null)

    console.log('🔍 NEATTrainingProvider initialized:', {
        neatRefInitial: neatRef.current,
        hasInitialized,
        isInitializing,
    })

    const { triggerReset } = useRaceReset()

    const aiModels = useNEATStored({
        onError: error => {
            console.error('Backend error:', error.message)
            setBackendError(error.message)
        },
        onSuccess: message => {
            console.log('Backend success:', message)
            setBackendError(null)
        },
    })

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

    const handleCarElimination = useCallback((carId: string) => {
        setCarStates(prev => {
            const newState = new Map(prev)
            const carState = newState.get(carId)
            if (carState) {
                carState.isEliminated = true
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

    const restartFromCurrentGeneration = useCallback(() => {
        console.log(
            `🔄 Restarting generation ${generation} with new population`
        )

        neatRef.current = new Neat(6, 3, null, {
            mutation: methods.mutation.ALL,
            popsize: 20,
            mutationRate: 0.55,
            elitism: 3,
        })

        neatRef.current.population.forEach((network: any) => {
            for (let i = 0; i < 50; i++) {
                network.mutate(
                    methods.mutation.ALL[
                        Math.floor(Math.random() * methods.mutation.ALL.length)
                    ]
                )
            }
        })

        setCarStates(new Map())
        setIsTraining(false)
        setBestFitness(0)
        simulationActive.current = false

        triggerReset()
        setTimeout(() => {
            simulationActive.current = true
            console.log(
                `Generation ${generation} restarted with fresh population - all cars reset to starting positions`
            )
            if (onReset) {
                onReset()
            }
        }, 100)
    }, [generation, onReset, triggerReset])

    const evolveToNextGeneration = useCallback(async () => {
        console.log('🔥 EVOLVE BUTTON CLICKED! Current generation:', generation)

        if (aiModels.isAuthReady && carStates.size > 0) {
            try {
                console.log(
                    '💾 Checking current backend generation before saving...'
                )

                const latestGeneration = await aiModels.loadLatestGeneration()
                if (
                    latestGeneration &&
                    latestGeneration.generationNumber >= generation
                ) {
                    console.log(
                        `⚠️ Generation ${generation} already exists in backend (latest: ${latestGeneration.generationNumber}). Skipping save before evolution.`
                    )
                } else {
                    console.log(
                        '💾 Saving current generation before evolution...'
                    )

                    const neatExportRaw = neatRef.current.export()

                    const neatExportData =
                        typeof neatExportRaw === 'string'
                            ? JSON.parse(neatExportRaw)
                            : neatExportRaw

                    const fitnessMap = new Map<string, { fitness: number }>()
                    carStates.forEach((carState, carId) => {
                        fitnessMap.set(carId, { fitness: carState.fitness })
                    })

                    const neatConfig = {
                        populationSize: neatRef.current.popsize,
                        mutationRate: 0.55,
                        elitism: 3,
                        inputNodes: 6,
                        outputNodes: 3,
                    }

                    await aiModels.saveGeneration(
                        generation,
                        neatExportData,
                        neatConfig
                    )

                    const verifyGeneration =
                        await aiModels.loadLatestGeneration()
                    if (!verifyGeneration) {
                        console.warn(
                            `Generation save verification failed: No generation data returned from backend`
                        )
                    } else if (
                        verifyGeneration.generationNumber !== generation
                    ) {
                        console.warn(
                            `Generation save verification failed. Expected: ${generation}, Got: ${verifyGeneration.generationNumber}`
                        )
                    } else {
                        console.log(
                            `✅ Generation ${generation} verified successfully in backend`
                        )
                    }
                }
            } catch (error) {
                console.warn(
                    'Failed to save generation before evolution:',
                    error
                )
            }
        }

        const carStatesArray = Array.from(carStates.values())
        neatRef.current.population.forEach((network: any, i: number) => {
            const carState = carStatesArray[i]
            network.score = carState ? carState.fitness : 0
        })

        neatRef.current.evolve().then(async () => {
            const newGeneration = generation + 1
            setGeneration(newGeneration)
            setCarStates(new Map())
            setIsTraining(false)
            simulationActive.current = false

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

    const saveCurrentGeneration = useCallback(async () => {
        if (!aiModels.isAuthReady) {
            setBackendError('No authentication available')
            return
        }

        setIsSaving(true)
        setBackendError(null)
        try {
            console.log(
                '📤 Checking current backend generation before saving...'
            )

            const latestGeneration = await aiModels.loadLatestGeneration()
            if (
                latestGeneration &&
                latestGeneration.generationNumber >= generation
            ) {
                console.log(
                    `⚠️ Generation ${generation} already exists in backend (latest: ${latestGeneration.generationNumber}). Skipping save.`
                )
                return
            }

            console.log('📤 Saving generation to backend...')

            const neatExportRaw = neatRef.current.export()

            const neatExportData =
                typeof neatExportRaw === 'string'
                    ? JSON.parse(neatExportRaw)
                    : neatExportRaw

            const fitnessMap = new Map<string, { fitness: number }>()
            carStates.forEach((carState, carId) => {
                fitnessMap.set(carId, { fitness: carState.fitness })
            })

            const neatConfig = {
                populationSize: neatRef.current.popsize,
                mutationRate: 0.55,
                elitism: 3,
                inputNodes: 6,
                outputNodes: 3,
            }

            await aiModels.saveGeneration(
                generation,
                neatExportData,
                neatConfig
            )

            await new Promise(resolve => setTimeout(resolve, 100))

            const verifyGeneration = await aiModels.loadLatestGeneration()
            if (!verifyGeneration) {
                console.warn(
                    `Generation save verification failed: No generation data returned from backend`
                )
            } else if (verifyGeneration.generationNumber !== generation) {
                console.warn(
                    `Generation save verification failed. Expected: ${generation}, Got: ${verifyGeneration.generationNumber}`
                )
            } else {
                console.log(
                    `✅ Generation ${generation} verified successfully in backend`
                )
            }

            try {
                await updateAiGeneration(generation)
            } catch (profileError) {
                console.warn('Failed to update player profile:', profileError)
            }

            console.log('✅ Generation saved and verified successfully')
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
                console.log('🔄 Importing population data using neataptic...')

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
                        '🔄 Importing population data using neataptic...'
                    )

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

            await aiModels.resetAllGenerations()

            setGeneration(1)
            setCarStates(new Map())
            setBestFitness(0)
            setIsTraining(false)
            simulationActive.current = false

            neatRef.current = new Neat(6, 3, null, {
                mutation: methods.mutation.ALL,
                popsize: 20,
                mutationRate: 0.55,
                elitism: 3,
            })
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

    const clearBackendError = useCallback(() => {
        setBackendError(null)
    }, [])

    useEffect(() => {
        console.log('🔍 Initialization useEffect triggered:', {
            hasInitialized,
            initializationInProgress: initializationInProgress.current,
            shouldInitialize:
                !hasInitialized && !initializationInProgress.current,
            neatRefCurrent: !!neatRef.current,
        })

        if (!hasInitialized && !initializationInProgress.current) {
            initializationInProgress.current = true

            const initializeFromBackend = async () => {
                console.log('🚀 Starting NEAT initialization...', {
                    isAuthReady: aiModels.isAuthReady,
                    loading: aiModels.loading,
                    error: aiModels.error,
                    hasInitialized,
                    initializationInProgress: initializationInProgress.current,
                })

                try {
                    if (aiModels.isAuthReady) {
                        console.log(
                            '🔄 Auth ready, checking database for AI data...'
                        )

                        console.log('📡 Calling loadLatestGeneration...')
                        const response = await aiModels.loadLatestGeneration()

                        if (response) {
                            console.log('✅ Database response received:', {
                                generationNumber: response.generationNumber,
                                hasNeatExportData: !!response.neatExportData,
                                neatExportDataType:
                                    typeof response.neatExportData,
                                neatConfig: response.neatConfig,
                            })

                            console.log(
                                '🔄 Creating NEAT instance with loaded config...'
                            )

                            neatRef.current = new Neat(
                                response.neatConfig.inputNodes,
                                response.neatConfig.outputNodes,
                                null,
                                {
                                    mutation: methods.mutation.ALL,
                                    popsize: response.neatConfig.populationSize,
                                    mutationRate:
                                        response.neatConfig.mutationRate,
                                    elitism: response.neatConfig.elitism,
                                }
                            )

                            console.log('✅ NEAT instance created:', {
                                neatRefExists: !!neatRef.current,
                                hasPopulation: !!neatRef.current?.population,
                                populationLength:
                                    neatRef.current?.population?.length,
                            })

                            console.log(
                                '📥 Importing population data using neataptic...'
                            )

                            neatRef.current.import(response.neatExportData)

                            console.log('✅ Population imported:', {
                                populationAfterImport:
                                    neatRef.current?.population?.length,
                                neatRefStillExists: !!neatRef.current,
                            })

                            setGeneration(response.generationNumber)
                            console.log(
                                `✅ Successfully restored generation ${response.generationNumber} from database`
                            )
                            console.log(
                                '👥 Population size after import:',
                                neatRef.current.population?.length
                            )
                        } else {
                            console.log(
                                '🆕 No saved data found in database - creating fresh NEAT instance'
                            )

                            neatRef.current = new Neat(6, 3, null, {
                                mutation: methods.mutation.ALL,
                                popsize: 20,
                                mutationRate: 0.55,
                                elitism: 3,
                            })

                            console.log('✅ Fresh NEAT instance created:', {
                                neatRefExists: !!neatRef.current,
                                hasPopulation: !!neatRef.current?.population,
                                populationLength:
                                    neatRef.current?.population?.length,
                            })

                            neatRef.current.population.forEach(
                                (network: any) => {
                                    for (let i = 0; i < 50; i++) {
                                        network.mutate(
                                            methods.mutation.ALL[
                                                Math.floor(
                                                    Math.random() *
                                                        methods.mutation.ALL
                                                            .length
                                                )
                                            ]
                                        )
                                    }
                                }
                            )

                            console.log(
                                '✅ Mutations applied to fresh NEAT instance:',
                                {
                                    populationAfterMutations:
                                        neatRef.current?.population?.length,
                                    neatRefStillExists: !!neatRef.current,
                                }
                            )

                            console.log('✅ Created fresh NEAT instance:', {
                                populationSize:
                                    neatRef.current.population?.length,
                                inputNodes: 6,
                                outputNodes: 3,
                            })

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
                            '⚠️ Auth not ready yet, creating temporary NEAT instance'
                        )

                        if (!neatRef.current) {
                            neatRef.current = new Neat(6, 3, null, {
                                mutation: methods.mutation.ALL,
                                popsize: 20,
                                mutationRate: 0.55,
                                elitism: 3,
                            })

                            neatRef.current.population.forEach(
                                (network: any) => {
                                    for (let i = 0; i < 50; i++) {
                                        network.mutate(
                                            methods.mutation.ALL[
                                                Math.floor(
                                                    Math.random() *
                                                        methods.mutation.ALL
                                                            .length
                                                )
                                            ]
                                        )
                                    }
                                }
                            )

                            console.log(
                                '✅ Created temporary NEAT instance (auth not ready):',
                                {
                                    populationSize:
                                        neatRef.current.population?.length,
                                }
                            )
                        }

                        if (backendError) {
                            console.warn(
                                'Backend error detected:',
                                backendError
                            )
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ Failed to initialize from backend:',
                        error
                    )
                    setBackendError('Failed to load initial data from backend')

                    if (!neatRef.current) {
                        console.log('🔧 Creating fallback NEAT instance...')
                        neatRef.current = new Neat(6, 3, null, {
                            mutation: methods.mutation.ALL,
                            popsize: 20,
                            mutationRate: 0.55,
                            elitism: 3,
                        })

                        neatRef.current.population.forEach((network: any) => {
                            for (let i = 0; i < 50; i++) {
                                network.mutate(
                                    methods.mutation.ALL[
                                        Math.floor(
                                            Math.random() *
                                                methods.mutation.ALL.length
                                        )
                                    ]
                                )
                            }
                        })

                        console.log('✅ Created fallback NEAT instance:', {
                            populationSize: neatRef.current.population?.length,
                        })
                    }
                }

                console.log('🏁 Finishing NEAT initialization...', {
                    hasNeatInstance: !!neatRef.current,
                    populationSize: neatRef.current?.population?.length,
                    generation: generation,
                    neatRefCurrentType: typeof neatRef.current,
                    neatRefCurrentKeys: neatRef.current
                        ? Object.keys(neatRef.current)
                        : 'null',
                })

                console.log(
                    '🔍 Final check before completing initialization:',
                    {
                        neatRefCurrent: neatRef.current,
                        hasPopulation: !!neatRef.current?.population,
                        populationLength: neatRef.current?.population?.length,
                    }
                )

                setIsInitializing(false)
                setHasInitialized(true)
                initializationInProgress.current = false

                console.log(
                    '✅ NEAT Training Context initialization complete',
                    {
                        neatRefCurrentAfterStateSet: !!neatRef.current,
                        populationAfterStateSet:
                            neatRef.current?.population?.length,
                    }
                )
            }

            console.log('🚀 Calling initializeFromBackend immediately...')
            initializeFromBackend()
        }

        return undefined
    }, [hasInitialized])

    const value: NEATTrainingContextType = {
        generation,
        isTraining,
        carStates,
        bestFitness,
        neatRef,
        simulationActive,

        isSaving,
        isLoading,
        isInitializing,
        isResetting,
        backendError,

        handleFitnessUpdate,
        handleCarElimination,
        areAllCarsEliminated,
        startTraining,
        stopTraining,
        restartGeneration,
        restartFromCurrentGeneration,
        evolveToNextGeneration,

        saveCurrentGeneration,
        loadLatestGeneration,
        loadSpecificGeneration,
        resetAllSavedGenerations,
        clearBackendError,
    }

    return (
        <NEATTrainingContext.Provider value={value}>
            {children}
        </NEATTrainingContext.Provider>
    )
}
