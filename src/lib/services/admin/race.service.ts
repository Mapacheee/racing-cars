import type { RaceFormData, Track, AIModel, Race } from '../../types/race'

const API_URL = import.meta.env['VITE_API_URL']

export const AdminRaceService = {
    async getTracks(token: string): Promise<Track[]> {
        const response = await fetch(`${API_URL}/tracks`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        if (!response.ok) throw new Error('Error al cargar las pistas')
        return response.json()
    },

    async getAIModels(token: string): Promise<AIModel[]> {
        const response = await fetch(`${API_URL}/ai-models`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        if (!response.ok) throw new Error('Error al cargar los modelos de IA')
        return response.json()
    },

    async createRace(raceData: RaceFormData, token: string): Promise<Race> {
        const response = await fetch(`${API_URL}/races`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(raceData),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'error al crear la carrera')
        }

        return response.json()
    },

    async getRaces(token: string): Promise<Race[]> {
        const response = await fetch(`${API_URL}/races`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'error al cargar las carreras')
        }

        return response.json()
    },

    async getRace(id: string, token: string): Promise<Race> {
        const response = await fetch(`${API_URL}/races/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'error al cargar la carrera')
        }

        return response.json()
    },

    async deleteRace(id: string, token: string): Promise<void> {
        const response = await fetch(`${API_URL}/races/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'error al borrar la carrera')
        }
    },
}
