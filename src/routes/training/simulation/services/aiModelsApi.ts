import axios, { type AxiosInstance } from 'axios'
import type { Genome, NEATConfig, Species } from '../types/neat'

const API_URL: string = import.meta.env['VITE_API_URL']

export interface AIModelResponse {
    id: string
    generationNumber: number
    neatGenomes: Genome[]
    config: NEATConfig
    bestGenome?: Genome
    species?: Species[]
    createdAt: string
    playerId: string
}

export interface CreateAIModelDto {
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
    genome: Genome
    createdAt: string
}

export interface ExportOptions {
    generationNumber?: number
    topN?: number
}

function createAuthenticatedClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: `${API_URL}/ai-models`,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        withCredentials: true,
    })
}

// Save a new generation
export async function pushGeneration(
    token: string,
    data: CreateAIModelDto
): Promise<AIModelResponse> {
    try {
        const client = createAuthenticatedClient(token)
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
export async function getLatestGeneration(
    token: string
): Promise<AIModelResponse | null> {
    try {
        const client = createAuthenticatedClient(token)
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
export async function getGeneration(
    token: string,
    generationNumber: number
): Promise<AIModelResponse> {
    try {
        const client = createAuthenticatedClient(token)
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
export async function getAllGenerations(
    token: string,
    options: {
        page?: number
        limit?: number
        sortOrder?: 'ASC' | 'DESC'
    } = {}
): Promise<PaginatedResponse<AIModelResponse>> {
    try {
        const { page = 1, limit = 10, sortOrder = 'DESC' } = options
        const client = createAuthenticatedClient(token)
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
export async function resetAllGenerations(token: string): Promise<void> {
    try {
        const client = createAuthenticatedClient(token)
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
export async function deleteGeneration(
    token: string,
    generationNumber: number
): Promise<void> {
    try {
        const client = createAuthenticatedClient(token)
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
export async function getGenerationStatistics(
    token: string
): Promise<GenerationStatistics> {
    try {
        const client = createAuthenticatedClient(token)
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
export async function getFitnessProgression(
    token: string
): Promise<FitnessProgression[]> {
    try {
        const client = createAuthenticatedClient(token)
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
export async function getBestPerformers(
    token: string,
    limit: number = 5
): Promise<BestPerformer[]> {
    try {
        const client = createAuthenticatedClient(token)
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

// Get best genomes across all generations
export async function getBestGenomes(
    token: string,
    limit: number = 10
): Promise<Genome[]> {
    try {
        const client = createAuthenticatedClient(token)
        const response = await client.get<Genome[]>('/genomes/best', {
            params: { limit },
        })
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al obtener mejores genomas'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Get genomes from a specific generation
export async function getGenomesFromGeneration(
    token: string,
    generationNumber: number
): Promise<Genome[]> {
    try {
        const client = createAuthenticatedClient(token)
        const response = await client.get<Genome[]>(
            `/genomes/generation/${generationNumber}`
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al obtener genomas de la generación'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

// Export genomes (for downloading/sharing)
export async function exportGenomes(
    token: string,
    options: ExportOptions = {}
): Promise<Blob> {
    try {
        const client = createAuthenticatedClient(token)
        const response = await client.get('/genomes/export', {
            params: options,
            responseType: 'blob',
        })
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error al exportar genomas'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}
