import { createContext, useContext, useState, useCallback, useRef, type ReactNode, type JSX } from 'react'
import { Neat, methods } from 'neataptic';
import { useRaceReset } from '../../../../lib/contexts/RaceResetContext'
import type { FitnessMetrics } from '../types/neat'

// Estado de los carros durante el entrenamiento
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

    // Funciones
    handleFitnessUpdate: (carId: string, fitness: number, metrics: FitnessMetrics) => void
    handleCarElimination: (carId: string) => void
    areAllCarsEliminated: () => boolean
    startTraining: () => void
    stopTraining: () => void
    restartGeneration: () => void
    evolveToNextGeneration: () => void
}

const NEATTrainingContext = createContext<NEATTrainingContextType | null>(null)

export function useNEATTraining(): NEATTrainingContextType | null {
    const context = useContext(NEATTrainingContext)
    return context
}

export function useNEATTrainingRequired(): NEATTrainingContextType {
    const context = useContext(NEATTrainingContext)
    if (!context) {
        console.error('useNEATTraining: Context is null. Component not wrapped in NEATTrainingProvider')
        throw new Error('useNEATTraining must be used within a NEATTrainingProvider')
    }
    return context
}

interface NEATTrainingProviderProps {
    children: ReactNode
    onReset?: () => void
}

export function NEATTrainingProvider({ children, onReset }: NEATTrainingProviderProps): JSX.Element {
    const [generation, setGeneration] = useState(1)
    const [isTraining, setIsTraining] = useState(false)
    const [carStates, setCarStates] = useState<Map<string, CarState>>(new Map())
    const [bestFitness, setBestFitness] = useState(0)

    const neatRef = useRef<any>(null);
    if (!neatRef.current) {
        neatRef.current = new Neat(
            6, // número de inputs
            3, // número de outputs
            null,
            {
                mutation: methods.mutation.ALL,
                popsize: 20,
                mutationRate: 0.6, 
                elitism: 3, 
            }
        );
        neatRef.current.population.forEach((network: any) => {
            for (let i = 0; i < 3; i++) {
                network.mutate(methods.mutation.ALL[Math.floor(Math.random() * methods.mutation.ALL.length)]);
            }
        });
    }

    // Hook para manejar reset de la escena
    const { triggerReset } = useRaceReset()

    const simulationActive = useRef(false)

    const handleFitnessUpdate = useCallback((carId: string, fitness: number, metrics: FitnessMetrics) => {
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
    }, [])

    // Función para eliminar un carro (cuando choca)
    const handleCarElimination = useCallback((carId: string) => {
        setCarStates(prev => {
            const newState = new Map(prev)
            const carState = newState.get(carId)
            if (carState) {
                carState.isEliminated = true
                console.log(`Car ${carId} eliminated! Fitness: ${carState.fitness.toFixed(2)}`)
            }
            return newState
        })
    }, [])

    // Verificar si todos los carros están eliminados
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
            console.log(`Generation ${generation} restarted - all cars reset to starting positions`)
            if (onReset) {
                onReset()
            }
        }, 100)
    }, [generation, onReset, triggerReset])

    const evolveToNextGeneration = useCallback(() => {
        console.log('🔥 EVOLVE BUTTON CLICKED! Current generation:', generation)
        // 1. Asignar fitness a cada red
        const carStatesArray = Array.from(carStates.values());
        neatRef.current.population.forEach((network: any, i: number) => {
            const carState = carStatesArray[i];
            network.score = carState ? carState.fitness : 0;
        });
        // 2. Evolucionar la población
        neatRef.current.evolve().then(() => {
            setGeneration(g => g + 1);
            setCarStates(new Map());
            setIsTraining(false);
            simulationActive.current = false;
            setTimeout(() => {
                triggerReset();
                simulationActive.current = true;
                console.log(`✅ Generation ${generation + 1} ready with evolved networks! Waiting for user to start training.`);
            }, 50);
        });
    }, [carStates, generation, triggerReset]);

    const value: NEATTrainingContextType = {
    generation,
    isTraining,
    carStates,
    bestFitness,
    neatRef,
    simulationActive,
    handleFitnessUpdate,
    handleCarElimination,
    areAllCarsEliminated,
    startTraining,
    stopTraining,
    restartGeneration,
    evolveToNextGeneration,
    }

    return (
        <NEATTrainingContext.Provider value={value}>
            {children}
        </NEATTrainingContext.Provider>
    )
}
