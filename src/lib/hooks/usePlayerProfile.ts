import { useAuth } from '../contexts/AuthContext'

/**
 * Hook that provides easy access to current user profile data
 */
export function usePlayerProfile() {
    const { auth, isLoading } = useAuth()

    const isPlayer = auth && 'aiGeneration' in auth
    const player = isPlayer ? auth : null

    return {
        player,
        isPlayer: !!isPlayer,
        username: player?.username || '',
        aiGeneration: player?.aiGeneration || 0,
        isLoading,
    }
}
