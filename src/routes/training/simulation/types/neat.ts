export interface NEATConfig {
    populationSize: number
    inputNodes: number
    outputNodes: number
    mutationRates: {
        addNode: number
        addConnection: number
        weightMutation: number
        disableConnection: number
        weightPerturbation: number
    }
    speciation: {
        compatibilityThreshold: number
        c1: number  // Coeficiente excess genes
        c2: number  // Coeficiente disjoint genes  
        c3: number  // Coeficiente weight dieSize: number
    }
}

export interface Gene {
    innovation: number
    from: number
    to: number
    weight: number
    enabled: boolean
}

export interface NodeGene {
    id: number
    type: 'input' | 'hidden' | 'output'
    layer: number
    value?: number
}

export interface Genome {
    id: string
    nodeGenes: NodeGene[]
    connectionGenes: Gene[]
    fitness: number
    adjustedFitness: number
    species?: number
}

export interface Species {
    id: number
    representative: Genome
    members: Genome[]
    averageFitness: number
    staleness: number
    bestFitness: number
}

export interface NetworkOutput {
    throttle: number    // -1 a 1 (acelerar/frenar)
    steering: number    // -1 a 1 (izquierda/derecha)
}

export interface FitnessMetrics {
    distanceTraveled: number
    timeAlive: number
    averageSpeed: number
    checkpointsReached: number
    collisions: number
    backwardMovement: number
}
