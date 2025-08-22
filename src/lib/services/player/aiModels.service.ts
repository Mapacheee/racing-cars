import axios, { type AxiosInstance } from 'axios'

const API_URL: string = import.meta.env['VITE_API_URL']

export interface NetworkMetadata {
    nodes?: number
    connections?: number
    species?: number
    isElite?: boolean
}

export interface NEATConfig {
    populationSize: number
    mutationRate: number
    elitism: number
    inputNodes: number
    outputNodes: number
}

export interface CreateAiModelDto {
    networkData: string
    metadata?: NetworkMetadata
    neatConfig: NEATConfig
}

export interface AIModelResponse {
    id: string
    playerId: string
    generationNumber: number
    networkIndex: number
    networkData: any
    fitness: number
    metadata: NetworkMetadata | null
    neatConfig: NEATConfig
    createdAt: string
    updatedAt: string
}

export interface GenerationResponse {
    generationNumber: number
    networks: AIModelResponse[]
    totalNetworks: number
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

export async function tryCreateAiModel(
    token: string,
    data: CreateAiModelDto
): Promise<AIModelResponse> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.post<AIModelResponse>('/', data)
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error creating AI model'
            )
        }
        throw new Error('Error connecting to server')
    }
}

export async function tryUpdateNetworkFitness(
    token: string,
    networkId: string,
    fitness: number
): Promise<AIModelResponse> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.patch<AIModelResponse>(
            `/${networkId}/fitness`,
            { fitness }
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error updating fitness'
            )
        }
        throw new Error('Error connecting to server')
    }
}

export async function tryGetLatestGeneration(
    token: string
): Promise<GenerationResponse | null> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<GenerationResponse>(
            '/generations/latest'
        )
        return response.data
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null
        }
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error getting latest generation'
            )
        }
        throw new Error('Error connecting to server')
    }
}

export async function tryGetGeneration(
    token: string,
    generationNumber: number
): Promise<GenerationResponse> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        const response = await client.get<GenerationResponse>(
            `/generations/${generationNumber}`
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error getting generation'
            )
        }
        throw new Error('Error connecting to server')
    }
}

export async function tryResetAllGenerations(token: string): Promise<void> {
    try {
        const client = tryCreateAuthenticatedClient(token)
        await client.delete('/generations/reset')
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error resetting generations'
            )
        }
        throw new Error('Error connecting to server')
    }
}

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
                error.response.data.message || 'Error deleting generation'
            )
        }
        throw new Error('Error connecting to server')
    }
}
