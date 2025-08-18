import type { Genome, NEATConfig } from '../../types/neat'
import { GenomeBuilder } from './Genome'
import { Mutations } from './Mutations'
import { DEFAULT_NEAT_CONFIG } from './NEATConfig'

export class Population {
    private genomes: Genome[] = [];
    private generation: number = 0;
    private config: NEATConfig;

    constructor(config: NEATConfig = DEFAULT_NEAT_CONFIG) {
        this.config = config;
        this.initializePopulation();
    }

    private initializePopulation(): void {
        this.genomes = [];
        for (let i = 0; i < this.config.populationSize; i++) {
            const genome = GenomeBuilder.createMinimal(this.config);
            this.genomes.push(genome);
        }
    }

    getGenomes(): Genome[] {
        return [...this.genomes];
    }

    getGeneration(): number {
        return this.generation;
    }

    evolve(): void {
        this.createNextGeneration();
        this.generation++;
    }

    private createNextGeneration(): void {
        const newGenomes: Genome[] = [];
        const bestGenome = this.getBestGenome();
        const stats = this.getStats();

        newGenomes.push(GenomeBuilder.copy(bestGenome));

        const randomCount = Math.max(2, Math.floor(this.config.populationSize * 0.15));
        for (let i = 0; i < randomCount; i++) {
            newGenomes.push(GenomeBuilder.createMinimal(this.config));
        }
        
        let mutationConfig = { ...this.config };
        if (stats.averageFitness < 5) {
            mutationConfig = {
                ...mutationConfig,
                mutationRates: {
                    ...mutationConfig.mutationRates,
                    weightMutation: Math.min(1, mutationConfig.mutationRates.weightMutation * 1.5),
                    addNode: Math.min(0.5, mutationConfig.mutationRates.addNode * 2),
                    addConnection: Math.min(0.5, mutationConfig.mutationRates.addConnection * 2)
                }
            };
        }
        for (let i = newGenomes.length; i < this.config.populationSize; i++) {
            const mutated = GenomeBuilder.copy(bestGenome);
            Mutations.mutate(mutated, mutationConfig);
            newGenomes.push(mutated);
        }

        this.genomes = newGenomes;
    }

    private getBestGenome(): Genome {
        return [...this.genomes].sort((a, b) => b.fitness - a.fitness)[0];
    }

    getStats() {
        const fitnesses = this.genomes.map(g => g.fitness);
        const bestFitness = Math.max(...fitnesses);
        const averageFitness = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;
        return {
            generation: this.generation,
            populationSize: this.genomes.length,
            bestFitness,
            averageFitness,
            bestGenome: this.genomes.find(g => g.fitness === bestFitness)
        };
    }
}
