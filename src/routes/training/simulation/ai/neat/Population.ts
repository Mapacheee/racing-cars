import type { Genome, Species, NEATConfig } from '../../types/neat'
import { GenomeBuilder, GenomeUtils } from './Genome'
import { Mutations } from './Mutations'
import { DEFAULT_NEAT_CONFIG, getAdaptiveMutationRates } from './NEATConfig'

export class Population {
    private genomes: Genome[] = []
    private species: Species[] = []
    private generation: number = 0
    private config: NEATConfig
    
    constructor(config: NEATConfig = DEFAULT_NEAT_CONFIG) {
        this.config = config
        this.initializePopulation()
    }
    
    private initializePopulation(): void {
        this.genomes = []
        
        for (let i = 0; i < this.config.populationSize; i++) {
            const genome = GenomeBuilder.createMinimal(this.config)
            this.genomes.push(genome)
        }
    }
    
    // Obtener todos los genomas de la población actual
    getGenomes(): Genome[] {
        return [...this.genomes]
    }
    
    // Obtener la generación actual
    getGeneration(): number {
        return this.generation
    }
    
    // Avanzar a la próxima generación
    evolve(): void {
        // 1. Especiación
        this.speciate()
        
        // 2. Calcular fitness ajustado
        this.calculateAdjustedFitness()
        
        // 3. Crear nueva generación
        this.createNextGeneration()
        
        this.generation++
        
        // Logging de evolución adaptativa
        if (this.generation % 5 === 0) {
            const rates = getAdaptiveMutationRates(this.generation)
            console.log(`🧬 Generation ${this.generation} - Adaptive mutation rates:`, {
                weightMutation: rates.weightMutation.toFixed(3),
                addNode: rates.addNode.toFixed(3),
                addConnection: rates.addConnection.toFixed(3)
            })
        }
    }
    
    private speciate(): void {
        this.species = []
        
        this.genomes.forEach(genome => {
            let placed = false
            
            // Intentar colocar en una especie existente
            for (const species of this.species) {
                const compatibility = GenomeUtils.calculateCompatibility(
                    genome, 
                    species.representative, 
                    this.config
                )
                
                if (compatibility < this.config.speciation.compatibilityThreshold) {
                    species.members.push(genome)
                    genome.species = species.id
                    placed = true
                    break
                }
            }
            
            // Si no encaja en ninguna especie, crear nueva
            if (!placed) {
                const newSpecies: Species = {
                    id: this.species.length,
                    representative: genome,
                    members: [genome],
                    averageFitness: 0,
                    staleness: 0,
                    bestFitness: genome.fitness
                }
                
                this.species.push(newSpecies)
                genome.species = newSpecies.id
            }
        })
        
        // Calcular estadísticas de especies
        this.species.forEach(species => {
            const totalFitness = species.members.reduce((sum, genome) => sum + genome.fitness, 0)
            species.averageFitness = totalFitness / species.members.length
            species.bestFitness = Math.max(...species.members.map(g => g.fitness))
        })
    }
    
    private calculateAdjustedFitness(): void {
        this.species.forEach(species => {
            species.members.forEach(genome => {
                // Fitness ajustado = fitness / tamaño de la especie
                genome.adjustedFitness = genome.fitness / species.members.length
            })
        })
    }
    
    private createNextGeneration(): void {
        const newGenomes: Genome[] = [];

        // Mejor genoma de la generación actual
        const bestGenome = this.getBestGenomes(1)[0];

        // Copias directas del mejor genoma (élite)
        const eliteCopies = Math.max(2, Math.floor(this.config.populationSize * 0.2));
        for (let i = 0; i < eliteCopies; i++) {
            newGenomes.push(GenomeBuilder.copy(bestGenome));
        }

        // Mutaciones del mejor genoma
        const mutationCopies = Math.floor(this.config.populationSize * 0.7);
        for (let i = 0; i < mutationCopies; i++) {
            const mutated = GenomeBuilder.copy(bestGenome);
            const adaptiveConfig = { ...this.config, mutationRates: getAdaptiveMutationRates(this.generation) };
            Mutations.mutate(mutated, adaptiveConfig);
            newGenomes.push(mutated);
        }

        // Resto: diversidad genética (aleatorios)
        while (newGenomes.length < this.config.populationSize) {
            const randomGenome = GenomeBuilder.createMinimal(this.config);
            newGenomes.push(randomGenome);
        }

        this.genomes = newGenomes;
    }
    
    /*private selectParent(totalFitness: number): Genome {
        // Selección por ruleta
        let randomValue = Math.random() * totalFitness
        
        for (const genome of this.genomes) {
            randomValue -= genome.adjustedFitness
            if (randomValue <= 0) {
                return genome
            }
        }
        
        // Fallback: devolver genoma aleatorio
        return this.genomes[Math.floor(Math.random() * this.genomes.length)]
    }*/
    
    private getBestGenomes(count: number): Genome[] {
        return [...this.genomes]
            .sort((a, b) => b.fitness - a.fitness)
            .slice(0, count)
    }
    
    // Obtener estadísticas de la población
    getStats() {
        const fitnesses = this.genomes.map(g => g.fitness)
        const bestFitness = Math.max(...fitnesses)
        const averageFitness = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length
        
        return {
            generation: this.generation,
            populationSize: this.genomes.length,
            speciesCount: this.species.length,
            bestFitness,
            averageFitness,
            bestGenome: this.genomes.find(g => g.fitness === bestFitness)
        }
    }
}
