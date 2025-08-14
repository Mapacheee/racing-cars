import axios from 'axios'
import type { Player, PlayerLogin } from '../../types/auth'

const API_URL: string = import.meta.env['VITE_API_URL']
axios.defaults.withCredentials = true

async function tryRegisterPlayer({
    username,
    password,
}: PlayerLogin): Promise<Player | never> {
    try {
        const response = await axios.post(`${API_URL}/auth/player/register`, {
            username,
            password,
        })
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Nombre de usuario ya registrado'
            )
        }
        throw new Error('Error al registrar jugador')
    }
}

export async function tryLoginPlayer({
    username,
    password,
}: PlayerLogin): Promise<Player | never> {
    try {
        const response = await axios.post(`${API_URL}/auth/player/login`, {
            username,
            password,
        })
        console.log(response)
        return response.data
    } catch (error) {
        if (
            axios.isAxiosError(error) &&
            error.response &&
            error.response.status > 500
        ) {
            throw new Error(
                error.response.data.message || 'Error interno del servidor'
            )
        }
    }

    const registerResponse = await tryRegisterPlayer({
        username,
        password,
    })

    return registerResponse
}

export async function tryRefreshPlayerToken(): Promise<Player | never> {
    try {
        const response = await axios.post(`${API_URL}/auth/player/refresh`)
        return response.data
    } catch (error) {
        throw new Error('Sesión expirada')
    }
}
