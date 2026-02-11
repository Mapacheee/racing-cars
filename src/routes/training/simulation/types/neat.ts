// NEAT evolution configuration
export interface NeatConfig {
    populationSize: number
    inputNodes: number
    outputNodes: number
    mutationRate: number
    elitism: number
}

// Genome for NEAT evolution
export interface Genome {
    id: string
    fitness: number
    toJSON(): any
}

// Neural network control output
export interface NetworkOutput {
    throttle: number // -1 to 1 (accelerate/brake)
    steering: number // -1 to 1 (left/right)
}

// Car performance metrics for fitness calculation
export interface FitnessMetrics {
    distanceTraveled: number
    timeAlive: number
    averageSpeed: number
    checkpointsReached: number
    collisions: number
}
