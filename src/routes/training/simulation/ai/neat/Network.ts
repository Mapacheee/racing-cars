import type { Genome, NodeGene, Gene, NetworkOutput } from '../../types/neat'
import type { SensorReading } from '../../types/sensors'

export class Network {
    private nodes: Map<number, NodeGene>
    private connections: Gene[]
    private nodeValues: Map<number, number>
    
    constructor(genome: Genome) {
        this.nodes = new Map()
        this.connections = [...genome.connectionGenes]
        this.nodeValues = new Map()
        
        // Inicializar nodos
        genome.nodeGenes.forEach(node => {
            this.nodes.set(node.id, { ...node })
        })
    }
    
    // Procesar inputs del sensor y obtener outputs de control
    activate(sensorInputs: SensorReading): NetworkOutput {
        // Limpiar valores anteriores
        this.nodeValues.clear()
        
        // Establecer valores de entrada (input nodes: 0-4)
        const inputs = [
            sensorInputs.left,
            sensorInputs.leftCenter, 
            sensorInputs.center,
            sensorInputs.rightCenter,
            sensorInputs.right
        ]
        
        inputs.forEach((value, index) => {
            this.nodeValues.set(index, value)
        })
        
        // Propagar hacia adelante a través de la red
        this.forwardPropagate()
        
        // Obtener outputs (output nodes son los últimos)
        const outputNodes = Array.from(this.nodes.values())
            .filter(node => node.type === 'output')
            .sort((a, b) => a.id - b.id)
        
        const throttle = this.nodeValues.get(outputNodes[0]?.id) || 0
        const steering = this.nodeValues.get(outputNodes[1]?.id) || 0
        
        return {
            throttle: this.tanh(throttle),    // Activación tanh para throttle
            steering: this.tanh(steering)     // Activación tanh para steering
        }
    }
    
    private forwardPropagate(): void {
        // Ordenar nodos por capa (layer)
        const sortedNodes = Array.from(this.nodes.values())
            .sort((a, b) => a.layer - b.layer)
        
        // Procesar cada capa
        const layers = this.groupNodesByLayer(sortedNodes)
        
        layers.forEach(layer => {
            layer.forEach(node => {
                if (node.type === 'input') {
                    // Los nodos de entrada ya tienen sus valores
                    return
                }
                
                // Calcular suma ponderada de las conexiones entrantes
                let sum = 0
                const incomingConnections = this.connections.filter(
                    conn => conn.to === node.id && conn.enabled
                )
                
                incomingConnections.forEach(conn => {
                    const inputValue = this.nodeValues.get(conn.from) || 0
                    sum += inputValue * conn.weight
                })
                
                // Aplicar función de activación
                const activatedValue = this.sigmoid(sum)
                this.nodeValues.set(node.id, activatedValue)
            })
        })
    }
    
    private groupNodesByLayer(nodes: NodeGene[]): NodeGene[][] {
        const layers: Map<number, NodeGene[]> = new Map()
        
        nodes.forEach(node => {
            if (!layers.has(node.layer)) {
                layers.set(node.layer, [])
            }
            layers.get(node.layer)!.push(node)
        })
        
        // Convertir a array ordenado por capa
        return Array.from(layers.entries())
            .sort(([a], [b]) => a - b)
            .map(([, nodes]) => nodes)
    }
    
    // Función de activación sigmoide
    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x))
    }
    
    // Función de activación tanh para outputs
    private tanh(x: number): number {
        return Math.tanh(x)
    }
    
    // Obtener el número total de conexiones activas
    getActiveConnectionCount(): number {
        return this.connections.filter(conn => conn.enabled).length
    }
    
    // Obtener el número total de nodos
    getNodeCount(): number {
        return this.nodes.size
    }
}
