import axios, { type AxiosInstance } from 'axios'
import type {
    Genome,
    NEATConfig,
} from '../../../routes/training/simulation/types/neat'

const API_URL: string = import.meta.env['VITE_API_URL']

// Updated interfaces for neataptic integration
export interface NeatapticNetworkData {
    networkIndex: number
    networkData: any // Serialized network from network.toJSON()
    fitness: number // network.score
    metadata?: {
        nodes?: number
        connections?: number
        isElite?: boolean
    }
}

export interface AIModelResponse {
    id: string
    generationNumber: number
    neatNetworks: NeatapticNetworkData[] // Changed from neatGenomes to neatNetworks
    neatConfig: {
        populationSize: number
        mutationRate: number
        elitism: number
        inputNodes: number
        outputNodes: number
    }
    bestNetwork?: NeatapticNetworkData // Changed from bestGenome
    createdAt: string
    playerId: string
}

export interface CreateAIModelDto {
    neatNetworks: NeatapticNetworkData[] // Changed from neatGenomes to neatNetworks
    neatConfig: {
        populationSize: number
        mutationRate: number
        elitism: number
        inputNodes: number
        outputNodes: number
    }
}

// Legacy interfaces for backward compatibility (if needed)
export interface LegacyCreateAIModelDto {
    neatGenomes: Genome[]
    config: NEATConfig
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface GenerationStatistics {
    totalGenerations: number
    averageFitness: number
    bestFitness: number
    currentGeneration: number
    totalTrainingTime?: number
}

export interface FitnessProgression {
    generation: number
    bestFitness: number
    averageFitness: number
    createdAt: string
}

export interface BestPerformer {
    generation: number
    fitness: number
    networkData: any // Changed from genome to networkData
    createdAt: string
}

export interface ExportOptions {
    generationNumber?: number
    topN?: number
}

function tryCreateAuthenticatedClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: `${API_URL}/ai-models`,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        withCredentials: true,
    })
}

// Utility functions for neataptic conversion
export function neatapticToBackend(
    neatRef: any,
    carStates: Map<string, { fitness: number }>
): CreateAIModelDto {
    const population = neatRef.population
    const carStatesArray = Array.from(carStates.values())

    const neatNetworks: NeatapticNetworkData[] = population.map(
        (network: any, index: number) => {
            const carState = carStatesArray[index]
            const fitness = carState?.fitness || network.score || 0

            return {
                networkIndex: index,
                networkData: network.toJSON(), // Neataptic serialization
                fitness: fitness,
                metadata: {
                    nodes: network.nodes?.length || 0,
                    connections: network.connections?.length || 0,
                    isElite: index < (neatRef.elitism || 3), // Elite networks
                },
            }
        }
    )

    return {
        neatNetworks,
        neatConfig: {
            populationSize: neatRef.popsize || 20,
            mutationRate: neatRef.mutationRate || 0.55,
            elitism: neatRef.elitism || 3,
            inputNodes: 6, // From current implementation
            outputNodes: 3, // From current implementation
        },
    }
}

export async function backendToNeataptic(
    response: AIModelResponse
): Promise<any> {
    // Dynamic import to avoid SSR issues
    const { Neat, Network, methods } = await import('neataptic')

    // Recreate Neat instance with the saved config
    const config = response.neatConfig
    const neat = new Neat(config.inputNodes, config.outputNodes, null, {
        popsize: config.populationSize,
        mutationRate: config.mutationRate,
        elitism: config.elitism,
        mutation: methods.mutation.ALL,
    })

    // Load networks from saved data
    try {
        neat.population = response.neatNetworks
            .sort((a, b) => a.networkIndex - b.networkIndex)
            .map(networkData => {
                const network = Network.fromJSON(networkData.networkData)
                network.score = networkData.fitness
                return network
            })
    } catch (error) {
        console.error('Error reconstructing networks from backend data:', error)
        // Fallback: create new random population
        neat.population.forEach((network: any) => {
            for (let i = 0; i < 50; i++) {
                network.mutate(
                    methods.mutation.ALL[
                        Math.floor(Math.random() * methods.mutation.ALL.length)
                    ]
                )
            }
        })
    }

    return neat
}

// Save a new generation
export async function tryPushGeneration(
    token: string,
    data: CreateAIModelDto
): Promise<AIModelResponse> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.post<AIModelResponse>(
            '/generations',
            data
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al guardar generación'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get the latest generation
export async function tryGetLatestGeneration(
    token: string
): Promise<AIModelResponse | null> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<AIModelResponse>(
            '/generations/latest'
        )
        return response.data
    } catch (error: any) {
        // Return null if no generations exist yet
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null
        }
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al obtener última generación'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get a specific generation
export async function tryGetGeneration(
    token: string,
    generationNumber: number
): Promise<AIModelResponse> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<AIModelResponse>(
            `/generations/${generationNumber}`
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al obtener generación'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get all generations with pagination
export async function tryGetAllGenerations(
    token: string,
    options: {
        page?: number
        limit?: number
        sortOrder?: 'ASC' | 'DESC'
    } = {}
): Promise<PaginatedResponse<AIModelResponse>> {
    try {
        const { page = 1, limit = 10, sortOrder = 'DESC' } = options
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<PaginatedResponse<AIModelResponse>>(
            '/generations',
            {
                params: { page, limit, sortOrder },
            }
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al obtener generaciones'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Reset all generations
export async function tryResetAllGenerations(token: string): Promise<void> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        await client.delete('/generations/reset')
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al resetear generaciones'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Delete a specific generation
export async function tryDeleteGeneration(
    token: string,
    generationNumber: number
): Promise<void> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        await client.delete(`/generations/${generationNumber}`)
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al eliminar generación'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get generation statistics
export async function tryGetGenerationStatistics(
    token: string
): Promise<GenerationStatistics> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<GenerationStatistics>('/statistics')
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al obtener estadísticas'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get fitness progression over generations
export async function tryGetFitnessProgression(
    token: string
): Promise<FitnessProgression[]> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<FitnessProgression[]>(
            '/statistics/fitness-progression'
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al obtener progresión de fitness'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get best performing generations
export async function tryGetBestPerformers(
    token: string,
    limit: number = 5
): Promise<BestPerformer[]> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<BestPerformer[]>(
            '/statistics/best-performers',
            {
                params: { limit },
            }
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al obtener mejores resultados'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get best networks across all generations
export async function tryGetBestNetworks(
    token: string,
    limit: number = 10
): Promise<NeatapticNetworkData[]> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<NeatapticNetworkData[]>(
            '/networks/best',
            {
                params: { limit },
            }
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al obtener mejores redes'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get networks from a specific generation
export async function tryGetNetworksFromGeneration(
    token: string,
    generationNumber: number
): Promise<NeatapticNetworkData[]> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<NeatapticNetworkData[]>(
            `/networks/generation/${generationNumber}`
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al obtener redes de la generación'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Export networks (for downloading/sharing)
export async function tryExportNetworks(
    token: string,
    options: ExportOptions = {}
): Promise<Blob> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get('/networks/export', {
            params: options,
            responseType: 'blob',
        })
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al exportar redes'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}
