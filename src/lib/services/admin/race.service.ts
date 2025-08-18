import axios from 'axios'
import type { RaceFormData, Track, AIModel, Race } from '../../types/race'

const API_URL = import.meta.env['VITE_API_URL']

const client = axios.create({ baseURL: API_URL })

function extractErrorMessage(error: any, fallback: string) {
    if (!error || typeof error !== 'object') return fallback
    if (error.response && error.response.data && error.response.data.message)
        return error.response.data.message
    if (error.message) return error.message
    return fallback
}

export const AdminRaceService = {
    async getTracks(token: string): Promise<Track[]> {
        try {
            const res = await client.get<Track[]>('/tracks', {
                headers: { Authorization: `Bearer ${token}` },
            })
            return res.data
        } catch (err) {
            throw new Error(
                extractErrorMessage(err, 'Error al cargar las pistas')
            )
        }
    },

    async getAIModels(token: string): Promise<AIModel[]> {
        try {
            const res = await client.get<AIModel[]>('/ai-models', {
                headers: { Authorization: `Bearer ${token}` },
            })
            return res.data
        } catch (err) {
            throw new Error(
                extractErrorMessage(err, 'Error al cargar los modelos de IA')
            )
        }
    },

    async createRace(raceData: RaceFormData, token: string): Promise<Race> {
        try {
            const res = await client.post<Race>('/races', raceData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })
            return res.data
        } catch (err) {
            throw new Error(
                extractErrorMessage(err, 'error al crear la carrera')
            )
        }
    },

    async getRaces(token: string): Promise<Race[]> {
        try {
            const res = await client.get<Race[]>('/races', {
                headers: { Authorization: `Bearer ${token}` },
            })
            return res.data
        } catch (err) {
            throw new Error(
                extractErrorMessage(err, 'error al cargar las carreras')
            )
        }
    },

    async getRace(id: string, token: string): Promise<Race> {
        try {
            const res = await client.get<Race>(`/races/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            return res.data
        } catch (err) {
            throw new Error(
                extractErrorMessage(err, 'error al cargar la carrera')
            )
        }
    },

    async deleteRace(id: string, token: string): Promise<void> {
        try {
            await client.delete(`/races/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
        } catch (err) {
            throw new Error(
                extractErrorMessage(err, 'error al borrar la carrera')
            )
        }
    },
}
