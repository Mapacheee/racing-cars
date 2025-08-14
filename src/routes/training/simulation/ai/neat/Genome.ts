import type { Genome, NodeGene, Gene, NEATConfig } from '../../types/neat'
import { InnovationCounter } from './NEATConfig'

export class GenomeBuilder {
    static createMinimal(config: NEATConfig): Genome {
        const nodeGenes: NodeGene[] = []
        const connectionGenes: Gene[] = []
        
        // Crear nodos de entrada (input layer = 0)
        for (let i = 0; i < config.inputNodes; i++) {
            nodeGenes.push({
                id: i,
                type: 'input',
                layer: 0
            })
        }
        
        // Crear nodos de salida (output layer = 1)
        for (let i = 0; i < config.outputNodes; i++) {
            const outputNodeId = config.inputNodes + i
            nodeGenes.push({
                id: outputNodeId,
                type: 'output', 
                layer: 1
            })
        }
        
        // Crear conexiones iniciales aleatorias (no todas las entradas conectadas)
        const innovationCounter = InnovationCounter.getInstance()
        
        
        for (let output = 0; output < config.outputNodes; output++) {
            const outputNodeId = config.inputNodes + output
            
            const connectionsPerOutput = 2 + Math.floor(Math.random() * 3) // 2-4 conexiones
            const inputsToConnect = new Set<number>()
            
            while (inputsToConnect.size < Math.min(connectionsPerOutput, config.inputNodes)) {
                const randomInput = Math.floor(Math.random() * config.inputNodes)
                inputsToConnect.add(randomInput)
            }
            
            inputsToConnect.forEach(inputId => {
                connectionGenes.push({
                    innovation: innovationCounter.getNext(),
                    from: inputId,
                    to: outputNodeId,
                    weight: (Math.random() * 6) - 3, 
                    enabled: true
                })
            })
        }
        
        // Ya no necesitamos esto porque conectamos todo arriba
        /*
        // Asegurar que al menos hay una conexión por salida
        for (let output = 0; output < config.outputNodes; output++) {
            const outputNodeId = config.inputNodes + output
            const hasConnection = connectionGenes.some(gene => gene.to === outputNodeId)
            
            if (!hasConnection) {
                const randomInput = Math.floor(Math.random() * config.inputNodes)
                connectionGenes.push({
                    innovation: innovationCounter.getNext(),
                    from: randomInput,
                    to: outputNodeId,
                    weight: (Math.random() * 4) - 2,
                    enabled: true
                })
            }
        }
        */
        
        return {
            id: this.generateId(),
            nodeGenes,
            connectionGenes,
            fitness: 0,
            adjustedFitness: 0
        }
    }
    
    static copy(genome: Genome): Genome {
        return {
            id: this.generateId(),
            nodeGenes: genome.nodeGenes.map(node => ({ ...node })),
            connectionGenes: genome.connectionGenes.map(gene => ({ ...gene })),
            fitness: 0,
            adjustedFitness: 0
        }
    }
    
    static crossover(parent1: Genome, parent2: Genome): Genome {
        // El padre más apto contribuye con más genes
        const fitterParent = parent1.fitness >= parent2.fitness ? parent1 : parent2
        const weakerParent = parent1.fitness >= parent2.fitness ? parent2 : parent1
        
        const childNodeGenes: NodeGene[] = []
        const childConnectionGenes: Gene[] = []
        
        // Copiar todos los nodos del padre más apto
        fitterParent.nodeGenes.forEach(node => {
            childNodeGenes.push({ ...node })
        })
        
        // Crossover de conexiones
        const fitterConnections = new Map<number, Gene>()
        const weakerConnections = new Map<number, Gene>()
        
        fitterParent.connectionGenes.forEach(gene => {
            fitterConnections.set(gene.innovation, gene)
        })
        
        weakerParent.connectionGenes.forEach(gene => {
            weakerConnections.set(gene.innovation, gene)
        })
        
        // Procesar todos los genes del padre más apto
        fitterConnections.forEach((fitterGene, innovation) => {
            const weakerGene = weakerConnections.get(innovation)
            
            if (weakerGene) {
                // Matching genes: elegir aleatoriamente
                const chosenGene = Math.random() < 0.5 ? fitterGene : weakerGene
                childConnectionGenes.push({ ...chosenGene })
            } else {
                // Excess/Disjoint genes: tomar del padre más apto
                childConnectionGenes.push({ ...fitterGene })
            }
        })
        
        return {
            id: this.generateId(),
            nodeGenes: childNodeGenes,
            connectionGenes: childConnectionGenes,
            fitness: 0,
            adjustedFitness: 0
        }
    }
    
    private static generateId(): string {
        return `genome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
}

export class GenomeUtils {
    static calculateCompatibility(genome1: Genome, genome2: Genome, config: NEATConfig): number {
        const { c1, c2, c3 } = config.speciation
        
        const genes1 = new Map<number, Gene>()
        const genes2 = new Map<number, Gene>()
        
        genome1.connectionGenes.forEach(gene => genes1.set(gene.innovation, gene))
        genome2.connectionGenes.forEach(gene => genes2.set(gene.innovation, gene))
        
        const allInnovations = new Set([...genes1.keys(), ...genes2.keys()])
        const maxInnovation1 = Math.max(...genes1.keys())
        const maxInnovation2 = Math.max(...genes2.keys())
        
        let excessGenes = 0
        let disjointGenes = 0
        let matchingGenes = 0
        let weightDifference = 0
        
        allInnovations.forEach(innovation => {
            const gene1 = genes1.get(innovation)
            const gene2 = genes2.get(innovation)
            
            if (gene1 && gene2) {
                // Matching genes
                matchingGenes++
                weightDifference += Math.abs(gene1.weight - gene2.weight)
            } else {
                // Disjoint or excess gene
                if (innovation > Math.min(maxInnovation1, maxInnovation2)) {
                    excessGenes++
                } else {
                    disjointGenes++
                }
            }
        })
        
        const N = Math.max(genes1.size, genes2.size)
        const avgWeightDiff = matchingGenes > 0 ? weightDifference / matchingGenes : 0
        
        // Fórmula de compatibilidad NEAT
        return (c1 * excessGenes / N) + (c2 * disjointGenes / N) + (c3 * avgWeightDiff)
    }
}
