import type { NEATConfig } from '../../types/neat'

export const NEAT_INPUT_NODES = [
    'sensor_left',
    'sensor_leftCenter',
    'sensor_center',
    'sensor_rightCenter',
    'sensor_right',
    'speed_normalized', // velocidad actual normalizada
];

export const NEAT_OUTPUT_NODES = [
    'acceleration',      // 0-1, solo avanzar
    'turn_right',        // 0-1, giro derecha
    'turn_left',         // 0-1, giro izquierda
];

export const DEFAULT_NEAT_CONFIG: NEATConfig = {
    populationSize: 20,       // numero de autillos
    inputNodes: 6,           
    outputNodes: 3,        
    mutationRates: {
        addNode: 0.03,           
        addConnection: 0.08,    
        weightMutation: 0.8, 
        disableConnection: 0.06, 
        weightPerturbation: 0.5  
    },
    
    speciation: {
        compatibilityThreshold: 2.5,  
        c1: 1.0,  // Excess genes
        c2: 1.0,  // Disjoint genes
        c3: 0.4   // Weight differences
    },
    
    survival: {
        survivalRate: 0.15,  
        eliteSize: 4     
    }
}


export const FITNESS_CONFIG = {
    weights: {
        distance: 5.0,          
        speed: 3.0,           
        time: 2.0,              
        checkpoints: 15.0,     
        collisionPenalty: -1.0, 
        backwardPenalty: -0.5   
    },
    
    // Valores máximos para normalización
    maxValues: {
        distance: 500,          
        speed: 20,             
        time: 40,             
        checkpoints: 15       
    }
}

// ID counter para innovation numbers
export class InnovationCounter {
    private static instance: InnovationCounter
    private counter: number = 0
    
    static getInstance(): InnovationCounter {
        if (!InnovationCounter.instance) {
            InnovationCounter.instance = new InnovationCounter()
        }
        return InnovationCounter.instance
    }
    
    getNext(): number {
        return this.counter++
    }
    
    reset(): void {
        this.counter = 0
    }
}

export function getPopulationSize(): number {
    return DEFAULT_NEAT_CONFIG.populationSize
}

export function getAdaptiveMutationRates(generation: number): typeof DEFAULT_NEAT_CONFIG.mutationRates {
    const baseRates = DEFAULT_NEAT_CONFIG.mutationRates
    
    let scaleFactor: number
    if (generation <= 5) {
        scaleFactor = 4.0 - (generation * 0.2)  
    } else if (generation <= 10) {
        scaleFactor = 2.5 - ((generation - 5) * 0.2) 
    } else { scaleFactor = Math.max(0.6, 1.2 - ((generation - 10) * 0.12)) }
    
    return {
        addNode: Math.min(baseRates.addNode * scaleFactor, 0.25),         
        addConnection: Math.min(baseRates.addConnection * scaleFactor, 0.4), 
        weightMutation: Math.min(baseRates.weightMutation * scaleFactor, 1.0),
        disableConnection: Math.min(baseRates.disableConnection * scaleFactor, 0.2), 
        weightPerturbation: Math.min(baseRates.weightPerturbation * scaleFactor, 1.0) 
    }
}
