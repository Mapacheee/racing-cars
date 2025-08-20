import { useState, useCallback /*useEffect*/ } from 'react'
import { useAuth } from '../../../../lib/contexts/AuthContext'
import {
    tryPushGeneration,
    tryGetLatestGeneration,
    tryGetGeneration,
    tryResetAllGenerations,
    tryGetGenerationStatistics,
    tryExportNetworks,
    neatapticToBackend,
    backendToNeataptic,
    type CreateAIModelDto,
    type AIModelResponse,
    type NeatapticNetworkData,
} from '../../../../lib/services/player/aiModels.service'
import type { PlayerAuth } from '../../../../lib/types/auth'

interface UseAIModelsOptions {
    onError?: (error: Error) => void
    onSuccess?: (message: string) => void
}

export function useAIModels(options: UseAIModelsOptions = {}) {
    const { auth, isLoading } = useAuth<PlayerAuth>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // useEffect(() => {
    // console.log('@@@@ isLoading: ', isLoading)
    // console.log('@@@@ auth: ', auth)
    // }, [isLoading])

    const handleError = useCallback(
        (error: Error) => {
            const message = error.message || 'An unknown error occurred'
            setError(message)
            console.error('AI Models API Error:', error)
            options.onError?.(error)
        },
        [options]
    )

    const handleSuccess = useCallback(
        (message: string) => {
            setError(null)
            console.log('AI Models API Success:', message)
            options.onSuccess?.(message)
        },
        [options]
    )

    // Save current generation to backend (updated for neataptic)
    const saveGeneration = useCallback(
        async (
            generationNumber: number,
            neatRef: any,
            carStates: Map<string, { fitness: number }>
        ): Promise<AIModelResponse | null> => {
            if (!auth?.token) {
                handleError(new Error('No authentication token available'))
                return null
            }

            setLoading(true)
            try {
                const data: CreateAIModelDto = neatapticToBackend(
                    neatRef,
                    carStates
                )

                const result = await tryPushGeneration(auth.token, data)
                handleSuccess(
                    `Generation ${generationNumber} saved successfully`
                )
                return result
            } catch (error) {
                handleError(error as Error)
                return null
            } finally {
                setLoading(false)
            }
        },
        [auth, handleError, handleSuccess]
    )

    // Load latest generation from backend
    const loadLatestGeneration =
        useCallback(async (): Promise<AIModelResponse | null> => {
            if (!auth?.token) {
                handleError(new Error('No authentication token available'))
                return null
            }

            setLoading(true)
            try {
                const result = await tryGetLatestGeneration(auth.token)
                if (result) {
                    handleSuccess(
                        `Latest generation ${result.generationNumber} loaded`
                    )
                } else {
                    handleSuccess('No saved generations found')
                }
                return result
            } catch (error) {
                handleError(error as Error)
                return null
            } finally {
                setLoading(false)
            }
        }, [auth, handleError, handleSuccess])

    const loadGeneration = useCallback(
        async (generationNumber: number): Promise<AIModelResponse | null> => {
            if (!auth?.token) {
                handleError(new Error('No authentication token available'))
                return null
            }

            setLoading(true)
            try {
                const result = await tryGetGeneration(
                    auth.token,
                    generationNumber
                )
                handleSuccess(`Generation ${generationNumber} loaded`)
                return result
            } catch (error) {
                handleError(error as Error)
                return null
            } finally {
                setLoading(false)
            }
        },
        [auth, handleError, handleSuccess]
    )

    // Reset all saved generations
    const resetAllGenerations = useCallback(async (): Promise<boolean> => {
        if (!auth?.token) {
            handleError(new Error('No authentication token available'))
            return false
        }

        setLoading(true)
        try {
            await tryResetAllGenerations(auth.token)
            handleSuccess('All generations reset successfully')
            return true
        } catch (error) {
            handleError(error as Error)
            return false
        } finally {
            setLoading(false)
        }
    }, [auth, handleError, handleSuccess])

    // Get generation statistics
    const getStatistics = useCallback(async () => {
        if (!auth?.token) {
            handleError(new Error('No authentication token available'))
            return null
        }

        setLoading(true)
        try {
            const stats = await tryGetGenerationStatistics(auth.token)
            handleSuccess('Statistics loaded')
            return stats
        } catch (error) {
            handleError(error as Error)
            return null
        } finally {
            setLoading(false)
        }
    }, [auth, handleError, handleSuccess])

    // Check if any generations exist
    const hasAnyGenerations = useCallback(async (): Promise<boolean> => {
        if (!auth?.token) {
            console.warn(
                'No authentication token available for checking generations'
            )
            return false
        }

        try {
            const latest = await tryGetLatestGeneration(auth.token)
            return latest !== null
        } catch (error) {
            console.warn('Error checking for existing generations:', error)
            return false
        }
    }, [auth])

    // Export networks (updated for neataptic)
    const exportNetworks = useCallback(
        async (options: { generationNumber?: number; topN?: number } = {}) => {
            if (!auth?.token) {
                handleError(new Error('No authentication token available'))
                return false
            }

            setLoading(true)
            try {
                const blob = await tryExportNetworks(auth.token, options)

                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `neat-networks-${options.generationNumber || 'latest'}.json`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)

                handleSuccess('Networks exported successfully')
                return true
            } catch (error) {
                handleError(error as Error)
                return false
            } finally {
                setLoading(false)
            }
        },
        [auth, handleError, handleSuccess]
    )

    return {
        loading: loading || isLoading,
        error,
        isAuthReady: !isLoading && !!auth?.token,
        saveGeneration,
        loadLatestGeneration,
        loadGeneration,
        resetAllGenerations,
        getStatistics,
        hasAnyGenerations,
        exportNetworks,
        clearError: () => setError(null),

        // Conversion utilities
        neatapticToBackend,
        backendToNeataptic,
    }
}
