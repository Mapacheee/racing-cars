import axios, { type AxiosInstance } from 'axios'
import type { PlayerProfile } from '../../types/auth'

const API_URL: string = import.meta.env['VITE_API_URL']

function createAuthenticatedClient(token: string): AxiosInstance {
    return axios.create({
        baseURL: API_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        withCredentials: true,
    })
}

export async function tryFetchPlayerProfile(
    token: string,
    username: string
): Promise<PlayerProfile> {
    try {
        const client = createAuthenticatedClient(token)
        const response = await client.get(`/users/${username}`)
        return response.data
    } catch (error) {
        console.log('=========================================')
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al obtener perfil del jugador'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

export async function tryUpdatePlayerProfile(
    token: string,
    username: string,
    updates: Partial<Pick<PlayerProfile, 'username' | 'aiGeneration'>>
): Promise<PlayerProfile> {
    try {
        const client = createAuthenticatedClient(token)
        const response = await client.patch(`/users/${username}`, updates)
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al actualizar perfil del jugador'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}

export async function trySyncPlayerAiGeneration(
    token: string,
    username: string
): Promise<PlayerProfile> {
    try {
        const client = createAuthenticatedClient(token)
        const response = await client.post(
            `/users/${username}/sync-ai-generation`
        )
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message ||
                    'Error al sincronizar generación de IA'
            )
        }
        throw new Error('Error al conectar con el servidor')
    }
}
