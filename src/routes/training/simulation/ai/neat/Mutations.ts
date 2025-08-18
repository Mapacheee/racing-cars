import type { Genome, NodeGene, NEATConfig } from '../../types/neat'
import { InnovationCounter } from './NEATConfig'

export class Mutations {
    static mutate(genome: Genome, config: NEATConfig): void {
        const { mutationRates } = config
        
        // Mutación de pesos
        if (Math.random() < mutationRates.weightMutation) {
            this.mutateWeights(genome, mutationRates.weightPerturbation)
        }
        
        // Agregar conexión
        if (Math.random() < mutationRates.addConnection) {
            this.addConnection(genome)
        }
        
        // Agregar nodo
        if (Math.random() < mutationRates.addNode) {
            this.addNode(genome)
        }
        
        // Deshabilitar conexión
        if (Math.random() < mutationRates.disableConnection) {
            this.disableConnection(genome)
        }
    }
    
    private static mutateWeights(genome: Genome, perturbationRate: number): void {
        genome.connectionGenes.forEach(gene => {
            if (Math.random() < perturbationRate) {
                gene.weight += (Math.random() * 0.6) - 0.3 // ±0.3 (era ±0.1) 
            } else {
                gene.weight = (Math.random() * 6) - 3 // -3 a +3 (era -1 a +1)
            }
        })
    }
    
    private static addConnection(genome: Genome): void {
        const nodes = genome.nodeGenes
        const connections = genome.connectionGenes
        
        // Encontrar pares de nodos que no estén conectados
        const possibleConnections: { from: number; to: number }[] = []
        
        nodes.forEach(fromNode => {
            nodes.forEach(toNode => {
                // No conectar a nodos de entrada o del mismo tipo/capa
                if (toNode.type === 'input' || fromNode.layer >= toNode.layer) {
                    return
                }
                
                // Verificar si ya existe esta conexión
                const connectionExists = connections.some(
                    conn => conn.from === fromNode.id && conn.to === toNode.id
                )
                
                if (!connectionExists) {
                    possibleConnections.push({
                        from: fromNode.id,
                        to: toNode.id
                    })
                }
            })
        })
        
        if (possibleConnections.length === 0) {
            return // No hay conexiones posibles
        }
        
        // Seleccionar conexión aleatoria
        const randomConnection = possibleConnections[
            Math.floor(Math.random() * possibleConnections.length)
        ]
        
        const innovationCounter = InnovationCounter.getInstance()
        
        // Agregar nueva conexión
        genome.connectionGenes.push({
            innovation: innovationCounter.getNext(),
            from: randomConnection.from,
            to: randomConnection.to,
            weight: (Math.random() * 4) - 2,
            enabled: true
        })
    }
    
    private static addNode(genome: Genome): void {
        const enabledConnections = genome.connectionGenes.filter(gene => gene.enabled)
        
        if (enabledConnections.length === 0) {
            return // No hay conexiones para dividir
        }
        
        // Seleccionar conexión aleatoria para dividir
        const connectionToSplit = enabledConnections[
            Math.floor(Math.random() * enabledConnections.length)
        ]
        
        // Deshabilitar la conexión original
        connectionToSplit.enabled = false
        
        // Crear nuevo nodo
        const newNodeId = this.getNextNodeId(genome)
        const fromNode = genome.nodeGenes.find(n => n.id === connectionToSplit.from)!
        
        const newNode: NodeGene = {
            id: newNodeId,
            type: 'hidden',
            layer: fromNode.layer + 1
        }
        
        genome.nodeGenes.push(newNode)
        
        // Ajustar capas si es necesario
        this.adjustLayers(genome, newNode)
        
        const innovationCounter = InnovationCounter.getInstance()
        
        // Crear dos nuevas conexiones
        genome.connectionGenes.push(
            {
                innovation: innovationCounter.getNext(),
                from: connectionToSplit.from,
                to: newNodeId,
                weight: 1.0, // Peso neutro
                enabled: true
            },
            {
                innovation: innovationCounter.getNext(),
                from: newNodeId,
                to: connectionToSplit.to,
                weight: connectionToSplit.weight, // Mantener el peso original
                enabled: true
            }
        )
    }
    
    private static disableConnection(genome: Genome): void {
        const enabledConnections = genome.connectionGenes.filter(gene => gene.enabled)
        
        if (enabledConnections.length <= 1) {
            return // No deshabilitar si quedan muy pocas conexiones
        }
        
        // Seleccionar conexión aleatoria para deshabilitar
        const connectionToDisable = enabledConnections[
            Math.floor(Math.random() * enabledConnections.length)
        ]
        
        connectionToDisable.enabled = false
    }
    
    private static getNextNodeId(genome: Genome): number {
        const maxId = Math.max(...genome.nodeGenes.map(node => node.id))
        return maxId + 1
    }
    
    private static adjustLayers(genome: Genome, newNode: NodeGene): void {
        // Encontrar nodos que necesitan ajuste de capa
        const nodesToAdjust = genome.nodeGenes.filter(
            node => node.layer >= newNode.layer && node.id !== newNode.id
        )
        
        // Incrementar la capa de nodos posteriores
        nodesToAdjust.forEach(node => {
            if (node.type !== 'input') {
                node.layer++
            }
        })
        
        // Recalcular capas basado en conexiones para asegurar consistencia
        this.recalculateLayers(genome)
    }
    
    private static recalculateLayers(genome: Genome): void {
        // Reset layers (excepto inputs)
        genome.nodeGenes.forEach(node => {
            if (node.type !== 'input') {
                node.layer = 0
            }
        })
        
        // Calcular capas iterativamente
        let changed = true
        let iterations = 0
        const maxIterations = 100
        
        while (changed && iterations < maxIterations) {
            changed = false
            iterations++
            
            genome.connectionGenes.forEach(connection => {
                if (!connection.enabled) return
                
                const fromNode = genome.nodeGenes.find(n => n.id === connection.from)
                const toNode = genome.nodeGenes.find(n => n.id === connection.to)
                
                if (fromNode && toNode && toNode.layer <= fromNode.layer) {
                    toNode.layer = fromNode.layer + 1
                    changed = true
                }
            })
        }
    }
}
