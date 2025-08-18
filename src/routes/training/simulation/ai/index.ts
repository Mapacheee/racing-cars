export { Network } from 'neat-javascript'
export { GenomeBuilder, GenomeUtils } from 'neat-javascript'
export { Mutations } from 'neat-javascript'
export { Population } from 'neat-javascript'
export {
    DEFAULT_NEAT_CONFIG,
    FITNESS_CONFIG,
    InnovationCounter,
} from 'neat-javascript'

// Fitness Evaluation
export { FitnessEvaluator } from './fitness/FitnessEvaluator'
export { CarFitnessTracker } from './fitness/CarFitnessTracker'
export { TrackDistanceTracker } from './fitness/TrackDistanceTracker'

// Car Control
export { NEATCarController } from './NEATCarController'

// Types
export type {
    NEATConfig,
    Genome,
    NodeGene,
    Gene,
    Species,
    NetworkOutput,
    FitnessMetrics,
} from '../types/neat'
