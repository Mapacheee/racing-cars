import { useAuth } from '../contexts/AuthContext'
import {
    tryUpdatePlayerProfile,
    trySyncPlayerAiGeneration,
    tryFetchPlayerProfile,
} from '../services/player/profile.service'

export function usePlayerProfileUpdates() {
    const { auth } = useAuth()

    const updateAiGeneration = async (newGeneration: number) => {
        if (!auth || !('aiGeneration' in auth) || !auth.token) {
            console.warn('Cannot update aiGeneration: no authenticated player')
            return
        }

        try {
            await tryUpdatePlayerProfile(auth.token, auth.username, {
                aiGeneration: newGeneration,
            })
            console.log(`Player aiGeneration updated to ${newGeneration}`)
        } catch (error) {
            console.warn('Failed to update player aiGeneration:', error)
            throw error
        }
    }

    const syncAiGeneration = async () => {
        if (!auth || !('aiGeneration' in auth) || !auth.token) {
            console.warn('Cannot sync aiGeneration: no authenticated player')
            return
        }

        try {
            const updatedProfile = await trySyncPlayerAiGeneration(
                auth.token,
                auth.username
            )
            console.log(
                `Player aiGeneration synced to ${updatedProfile.aiGeneration}`
            )
            return updatedProfile
        } catch (error) {
            console.warn('Failed to sync player aiGeneration:', error)
            throw error
        }
    }

    const getCurrentPlayerProfile = async () => {
        if (!auth || !('aiGeneration' in auth) || !auth.token) {
            console.warn('Cannot get player profile: no authenticated player')
            return null
        }

        try {
            const currentProfile = await tryFetchPlayerProfile(
                auth.token,
                auth.username
            )
            console.log(
                `Current player aiGeneration: ${currentProfile.aiGeneration}`
            )
            return currentProfile
        } catch (error) {
            console.warn('Failed to get current player profile:', error)
            throw error
        }
    }

    return {
        updateAiGeneration,
        syncAiGeneration,
        getCurrentPlayerProfile,
    }
}
