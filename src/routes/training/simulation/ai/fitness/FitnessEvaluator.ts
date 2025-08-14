import type { FitnessMetrics } from '../../types/neat'
import { FITNESS_CONFIG } from '../neat/NEATConfig'

export class FitnessEvaluator {
    static calculateFitness(metrics: FitnessMetrics): number {
        const { weights, maxValues } = FITNESS_CONFIG
        
        // Normalizar métricas
        const normalizedDistance = Math.min(metrics.distanceTraveled / maxValues.distance, 1)
        const normalizedSpeed = Math.min(metrics.averageSpeed / maxValues.speed, 1)
        const normalizedTime = Math.min(metrics.timeAlive / maxValues.time, 1)
        const normalizedCheckpoints = Math.min(metrics.checkpointsReached / maxValues.checkpoints, 1)
        
        // Calcular fitness base
        let fitness = 0
        
        // Recompensar distancia recorrida
        fitness += normalizedDistance * weights.distance
        
        // Recompensar velocidad promedio
        fitness += normalizedSpeed * weights.speed
        
        // Recompensar tiempo de supervivencia
        fitness += normalizedTime * weights.time
        
        // Recompensar checkpoints alcanzados (más importante)
        fitness += normalizedCheckpoints * weights.checkpoints
        
        // Penalizar colisiones
        fitness += metrics.collisions * weights.collisionPenalty
        
        // Penalizar movimiento hacia atrás
        fitness += metrics.backwardMovement * weights.backwardPenalty
        
        // Asegurar que el fitness no sea negativo
        return Math.max(fitness, 0.1)
    }
    
    static createEmptyMetrics(): FitnessMetrics {
        return {
            distanceTraveled: 0,
            timeAlive: 0,
            averageSpeed: 0,
            checkpointsReached: 0,
            collisions: 0,
            backwardMovement: 0
        }
    }
    
    // Función de bonus especial para comportamientos deseables
    static calculateBonusFitness(metrics: FitnessMetrics): number {
        let bonus = 0
        
        // Bonus por completar muchos checkpoints sin colisiones
        if (metrics.checkpointsReached >= 5 && metrics.collisions === 0) {
            bonus += 2.0
        }
        
        // Bonus por mantener velocidad constante
        if (metrics.averageSpeed > 3 && metrics.averageSpeed < 7) {
            bonus += 1.0
        }
        
        // Bonus por supervivencia larga sin colisiones
        if (metrics.timeAlive > 30 && metrics.collisions === 0) {
            bonus += 1.5
        }
        
        return bonus
    }
    
    // Función para detectar comportamientos problemáticos
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
