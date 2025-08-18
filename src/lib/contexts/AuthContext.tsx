import { createContext, useContext, useState, type ReactNode } from 'react'
import Cookies from 'js-cookie'
import type {
    AdminAuth,
    AuthContextType,
    PlayerAuth,
    AdminLogin,
    PlayerLogin,
    User,
} from '../types/auth'
import { tryLoginPlayer } from '../services/player/auth.service'
import { tryLoginAdmin } from '../services/admin/auth.service'
import { tryFetchPlayerProfile } from '../services/player/profile.service'

function clearAuthCookies(role: 'player' | 'admin' | 'both') {
    if (role === 'player') {
        Cookies.remove('player')
    } else if (role === 'admin') {
        Cookies.remove('admin')
    } else if (role === 'both') {
        Cookies.remove('player')
        Cookies.remove('admin')
    }
}

function setAuthCookies(data: User, role: 'player' | 'admin'): void {
    Cookies.set(role, JSON.stringify(data), { expires: 7 })
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<User | null>(null)
    const [role, setRole] = useState<'player' | 'admin' | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>('')

    useState(() => {
        const initializeAuth = async () => {
            const adminCookie = Cookies.get('admin')
            if (adminCookie) {
                try {
                    const adminData: User = JSON.parse(adminCookie)
                    setAuth(adminData)
                    setRole('admin')
                    setIsLoading(false)
                    return
                } catch {
                    clearAuthCookies('admin')
                }
            }

            const playerCookie = Cookies.get('player')
            if (playerCookie) {
                try {
                    const playerData: User = JSON.parse(playerCookie)

                    if ('aiGeneration' in playerData && playerData.token) {
                        try {
                            const freshProfile = await tryFetchPlayerProfile(
                                playerData.token,
                                playerData.username
                            )
                            setAuth(freshProfile)
                            setRole('player')
                            setAuthCookies(freshProfile, 'player')
                        } catch (error) {
                            // console.warn(
                            //     'Failed to fetch fresh profile, using cookie data:',
                            //     error
                            // )
                            setAuth(playerData)
                            setRole('player')
                        }
                    } else {
                        setAuth(playerData)
                        setRole('player')
                    }
                    setIsLoading(false)
                    return
                } catch {
                    clearAuthCookies('player')
                }
            }

            clearAuthCookies('both')
            setAuth(null)
            setRole(null)
            setIsLoading(false)
        }

        initializeAuth()
    })

    const setPlayer = async ({
        username,
        password,
    }: PlayerLogin): Promise<void | never> => {
        try {
            setIsLoading(true)
            setError('')

            const player = await tryLoginPlayer({ username, password })

            try {
                const freshProfile = await tryFetchPlayerProfile(
                    player.token,
                    player.username
                )
                setAuth(freshProfile)
                setRole('player')
                setAuthCookies(freshProfile, 'player')
            } catch (profileError) {
                console.warn(
                    'Failed to fetch fresh profile, using login data:',
                    profileError
                )
                setAuth(player)
                setRole('player')
                setAuthCookies(player, 'player')
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Error de autenticación'
            setError(errorMessage)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const setAdmin = async ({
        username,
        password,
    }: AdminLogin): Promise<void | never> => {
        try {
            setIsLoading(true)
            setError('')
            const admin = await tryLoginAdmin({ username, password })
            setAuth(admin)
            setRole('admin')
            setAuthCookies(admin, 'admin')
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Error de autenticación'
            setError(errorMessage)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const clearAuth = () => {
        setError('')
        clearAuthCookies('both')
    }

    const clearError = () => {
        setError('')
    }

    const isAdmin = () => role === 'admin'
    const isPlayer = () => role === 'player'

    return (
        <AuthContext.Provider
            value={{
                auth,
                isLoading,
                error,
                setPlayer,
                setAdmin,
                clearAuth,
                clearError,
                isAdmin,
                isPlayer,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// // Token refresh functionality
// useEffect(() => {
//     if (!auth) return

//     const refreshInterval = setInterval(async () => {
//         try {
//             if (role === 'player') {
//                 const refreshedPlayer = await tryRefreshPlayerToken()
//                 setAuth(refreshedPlayer)
//                 setAuthCookies(refreshedPlayer, 'player')
//             } else if (role === 'admin') {
//                 const refreshedAdmin = await AdminAuthService.refreshToken()
//                 setAuth(refreshedAdmin)
//                 setAuthCookies(refreshedAdmin, 'admin')
//             }
//         } catch (error) {
//             consle.log('Token refresh failed, logging out...')
//             clearAuth()
//         }
//     }, 15 * 60 * 1000) // 15 minutes

//     return () => clearInterval(refreshInterval)
// }, [auth, role])

export function useAuth<
    T extends AuthContextType | PlayerAuth | AdminAuth = AuthContextType,
>(): T {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context as T
}
