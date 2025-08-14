import axios from 'axios'
import type { Admin, AdminLogin } from '../../types/auth'

const API_URL: string = import.meta.env['VITE_API_URL']
axios.defaults.withCredentials = true

export async function tryLoginAdmin({
    username,
    password,
}: AdminLogin): Promise<Admin | never> {
    try {
        const response = await axios.post(`${API_URL}/auth/admin/login`, {
            username,
            password,
        })
        return response.data
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                error.response.data.message || 'Error de autenticación'
            )
        }
        throw new Error('Error de autenticación')
    }
}

export async function tryRefreshAdminToken(): Promise<Admin | never> {
    try {
        const response = await axios.post(`${API_URL}/auth/admin/refresh`)
        return response.data
    } catch (error) {
        throw new Error('Sesión expirada')
    }
}
