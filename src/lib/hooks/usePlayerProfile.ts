import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { tryFetchPlayerProfile } from '../services/player/profile.service'
import type { PlayerProfile } from '../types/auth'

// TODO: simplify auth to only hold the token, put the auth logic here
export function usePlayerProfile() {
    const { auth, isLoading: authLoading } = useAuth()
    const [profile, setProfile] = useState<PlayerProfile | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isPlayer = auth && 'aiGeneration' in auth
    const player = isPlayer ? auth : null

    useEffect(() => {
        async function fetchProfile() {
            if (!player?.token || !player?.username) {
                return
            }

            setIsLoading(true)
            setError(null)
            try {
                const freshProfile = await tryFetchPlayerProfile(
                    player.token,
                    player.username
                )
                setProfile(freshProfile)
            } catch (err) {
                console.warn('Failed to fetch fresh profile data:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')

                if (player) {
                    setProfile({
                        id: player.id,
                        username: player.username,
                        aiGeneration: player.aiGeneration,
                        createdAt: '',
                        updatedAt: '',
                    })
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [player?.token, player?.username])

    return {
        player,
        isPlayer: !!isPlayer,
        username: profile?.username || player?.username || '',
        aiGeneration: profile?.aiGeneration || player?.aiGeneration || 0,
        isLoading: authLoading || isLoading,
        error,
        profile,

        refreshProfile: async () => {
            if (player?.token && player?.username) {
                setIsLoading(true)
                try {
                    const freshProfile = await tryFetchPlayerProfile(
                        player.token,
                        player.username
                    )
                    setProfile(freshProfile)
                    setError(null)
                } catch (err) {
                    setError(
                        err instanceof Error ? err.message : 'Unknown error'
                    )
                } finally {
                    setIsLoading(false)
                }
            }
        },
    }
}
