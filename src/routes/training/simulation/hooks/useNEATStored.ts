import { useState, useCallback } from 'react'
import { useAuth } from '../../../../lib/contexts/AuthContext'
import {
    tryCreateAiModel,
    tryGetLatestGeneration,
    tryResetAllGenerations,
    type CreateAiModelDto,
    type NEATConfig,
} from '../../../../lib/services/player/aiModels.service'
import type { PlayerAuth } from '../../../../lib/types/auth'

interface UseNeatStoredOptions {
    onError?: (error: Error) => void
    onSuccess?: (message: string) => void
}

// Hook for NEAT data persistence
export const useNEATStored = (options: UseNeatStoredOptions = {}) => {
    const { auth, isLoading } = useAuth<PlayerAuth>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const saveGeneration = useCallback(
        async (generationNumber: number, neatExportData: any, neatConfig: NEATConfig) => {
            if (!auth?.token) return null
            
            setLoading(true)
            try {
                const createDto: CreateAiModelDto = {
                    networkData: JSON.stringify(neatExportData),
                    neatConfig,
                    metadata: {
                        nodes: neatExportData.nodes?.length || 0,
                        connections: neatExportData.connections?.length || 0,
                        species: Array.isArray(neatExportData) ? neatExportData.length : 1,
                        isElite: false,
                    },
                }

                const result = await tryCreateAiModel(auth.token, createDto)
                options.onSuccess?.(`Generation ${generationNumber} saved`)
                return result
            } catch (err) {
                const error = err as Error
                setError(error.message)
                options.onError?.(error)
                return null
            } finally {
                setLoading(false)
            }
        },
        [auth, options]
    )

    const loadLatestGeneration = useCallback(async () => {
        if (!auth?.token) return null
        
        setLoading(true)
        try {
            const result = await tryGetLatestGeneration(auth.token)
            
            if (!result?.networks?.[0]) {
                return null
            }

            const generationRecord = result.networks[0]
            const neatExportData = generationRecord.networkData

            if (!neatExportData || typeof neatExportData !== 'object') {
                throw new Error('Invalid network data')
            }

            options.onSuccess?.(`Generation ${result.generationNumber} loaded`)
            
            return {
                neatExportData,
                generationNumber: result.generationNumber,
                neatConfig: generationRecord.neatConfig || {
                    populationSize: 20,
                    mutationRate: 0.55,
                    elitism: 3,
                    inputNodes: 6,
                    outputNodes: 3,
                },
            }
        } catch (err) {
            const error = err as Error
            setError(error.message)
            options.onError?.(error)
            return null
        } finally {
            setLoading(false)
        }
    }, [auth, options])

    const resetAllGenerations = useCallback(async () => {
        if (!auth?.token) return false
        
        setLoading(true)
        try {
            await tryResetAllGenerations(auth.token)
            options.onSuccess?.('All generations reset')
            return true
        } catch (err) {
            const error = err as Error
            setError(error.message)
            options.onError?.(error)
            return false
        } finally {
            setLoading(false)
        }
    }, [auth, options])

    return {
        loading: loading || isLoading,
        error,
        isAuthReady: !isLoading && !!auth?.token,
        saveGeneration,
        loadLatestGeneration,
        resetAllGenerations,
        clearError: () => setError(null),
    }
}
