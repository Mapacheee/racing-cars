export type Player = {
    id: string
    username: string
    aiGeneration: number
    token: string
}

// Backend entity response (without token)
export type PlayerProfile = {
    id: string
    username: string
    aiGeneration: number
    createdAt: string
    updatedAt: string
}

export type Admin = {
    username: string
    token: string
}
export type User = Player | Admin

export type PlayerLogin = { username: string; password: string }
export type AdminLogin = { username: string; password: string }

export type AuthContextType = {
    auth: User | null
    isLoading: boolean
    error: string
    setPlayer: (player: PlayerLogin) => Promise<void | never>
    setAdmin: (admin: AdminLogin) => Promise<void | never>
    clearAuth: () => void
    clearError: () => void
    isAdmin: () => boolean
    isPlayer: () => boolean
}
export interface PlayerAuth extends AuthContextType {
    auth: Player
}
export interface AdminAuth extends AuthContextType {
    auth: Admin
}
