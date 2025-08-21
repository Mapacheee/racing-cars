export {
    DEFAULT_NEAT_CONFIG,
    FITNESS_CONFIG,
    InnovationCounter,
} from './neat/NEATConfig'

export { FitnessEvaluator } from './fitness/FitnessEvaluator'
export { CarFitnessTracker } from './fitness/CarFitnessTracker'
export { TrackDistanceTracker } from './fitness/TrackDistanceTracker'

export { NEATCarController } from './NEATCarController'

export type {
    NEATConfig,
    Genome,
    NodeGene,
    Gene,
    Species,
    NetworkOutput,
    FitnessMetrics,
} from '../types/neat'
