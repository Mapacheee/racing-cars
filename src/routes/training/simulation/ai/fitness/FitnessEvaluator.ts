import type { FitnessMetrics } from '../../types/neat'
import { FITNESS_CONFIG } from '../neat/NEATConfig'

export class FitnessEvaluator {
    static calculateFitness(metrics: FitnessMetrics): number {
        const { weights, maxValues } = FITNESS_CONFIG

        const normalizedDistance = Math.min(
            metrics.distanceTraveled / maxValues.distance,
            1
        )
        const normalizedSpeed = Math.min(
            metrics.averageSpeed / maxValues.speed,
            1
        )
        const normalizedCheckpoints = Math.min(
            metrics.checkpointsReached / maxValues.checkpoints,
            1
        )

        const DEFAULT_FITNESS = 0

        const distanceScore = normalizedDistance * weights.distance
        const speedScore = normalizedSpeed * weights.speed
        const checkpointScore = normalizedCheckpoints * weights.checkpoints
        const collisionPenalty = metrics.collisions * weights.collisionPenalty
        const backwardPenalty =
            metrics.backwardMovement * weights.backwardPenalty

        const fitness =
            DEFAULT_FITNESS +
            distanceScore +
            speedScore +
            checkpointScore +
            collisionPenalty +
            backwardPenalty

        return Math.max(fitness, 0.1)
    }

    static createEmptyMetrics(): FitnessMetrics {
        return {
            distanceTraveled: 0,
            timeAlive: 0,
            averageSpeed: 0,
            checkpointsReached: 0,
            collisions: 0,
            backwardMovement: 0,
        }
    }

    static calculateBonusFitness(metrics: FitnessMetrics): number {
        const CHECKPOINT_BONUS = 2.0
        const SPEED_BONUS = 1.0
        const SURVIVAL_BONUS = 1.5

        let bonus = 0

        if (metrics.checkpointsReached >= 5 && metrics.collisions === 0) {
            bonus += CHECKPOINT_BONUS
        }

        if (metrics.averageSpeed > 3 && metrics.averageSpeed < 7) {
            bonus += SPEED_BONUS
        }

        if (metrics.timeAlive > 30 && metrics.collisions === 0) {
            bonus += SURVIVAL_BONUS
        }

        return bonus
    }

    static detectProblematicBehavior(metrics: FitnessMetrics): string[] {
        const issues: string[] = []

        if (metrics.collisions > 5) {
            issues.push('Too many collisions')
        }

        if (metrics.averageSpeed < 0.5) {
            issues.push('Too slow')
        }

        if (metrics.backwardMovement > 10) {
            issues.push('Too much backward movement')
        }

        if (metrics.timeAlive < 5) {
            issues.push('Dies too quickly')
        }

        return issues
    }
}
