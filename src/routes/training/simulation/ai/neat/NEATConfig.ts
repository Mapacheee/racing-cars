import type { NeatConfig, FitnessMetrics } from '../../types/neat'

// Default NEAT configuration
export const DEFAULT_NEAT_CONFIG: NeatConfig = {
    populationSize: 20,
    inputNodes: 6,
    outputNodes: 3,
    mutationRate: 0.55,
    elitism: 3,
}

// Fitness calculation weights
export const FITNESS_WEIGHTS = {
    distance: 5.0,
    speed: 3.0,
    checkpoints: 15.0,
    collisionPenalty: -1.0,
} as const

// Calculate fitness score from metrics
export const calculateFitness = (metrics: FitnessMetrics): number => {
    const distanceScore = (metrics.distanceTraveled / 500) * FITNESS_WEIGHTS.distance
    const speedScore = (metrics.averageSpeed / 20) * FITNESS_WEIGHTS.speed
    const checkpointScore = (metrics.checkpointsReached / 15) * FITNESS_WEIGHTS.checkpoints
    const collisionPenalty = metrics.collisions * FITNESS_WEIGHTS.collisionPenalty
    
    return Math.max(distanceScore + speedScore + checkpointScore + collisionPenalty, 0.1)
}

// Create empty metrics
export const createEmptyMetrics = (): FitnessMetrics => ({
    distanceTraveled: 0,
    timeAlive: 0,
    averageSpeed: 0,
    checkpointsReached: 0,
    collisions: 0,
})

export const getPopulationSize = (): number => DEFAULT_NEAT_CONFIG.populationSize
