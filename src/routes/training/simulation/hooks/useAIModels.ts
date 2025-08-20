import { useState, useCallback /*useEffect*/ } from 'react'
import { useAuth } from '../../../../lib/contexts/AuthContext'
import {
    pushGeneration,
    getLatestGeneration,
    getGeneration,
    resetAllGenerations as resetAllGenerationsAPI,
    getGenerationStatistics,
    exportGenomes as exportGenomesAPI,
    type CreateAIModelDto,
    type AIModelResponse,
} from '../services/aiModelsApi'
import type { Genome, NEATConfig } from '../types/neat'
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

    // Save current generation to backend
    const saveGeneration = useCallback(
        async (
            generationNumber: number,
            genomes: Genome[],
            config: NEATConfig
        ): Promise<AIModelResponse | null> => {
            if (!auth?.token) {
                handleError(new Error('No authentication token available'))
                return null
            }

            setLoading(true)
            try {
                const data: CreateAIModelDto = {
                    neatGenomes: genomes,
                    config,
                }

                const result = await pushGeneration(auth.token, data)
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
                const result = await getLatestGeneration(auth.token)
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
                const result = await getGeneration(auth.token, generationNumber)
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
            await resetAllGenerationsAPI(auth.token)
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
            const stats = await getGenerationStatistics(auth.token)
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
            const latest = await getLatestGeneration(auth.token)
            return latest !== null
        } catch (error) {
            console.warn('Error checking for existing generations:', error)
            return false
        }
    }, [auth])

    // Export genomes
    const exportGenomes = useCallback(
        async (options: { generationNumber?: number; topN?: number } = {}) => {
            if (!auth?.token) {
                handleError(new Error('No authentication token available'))
                return false
            }

            setLoading(true)
            try {
                const blob = await exportGenomesAPI(auth.token, options)

                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `neat-genomes-${options.generationNumber || 'latest'}.json`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)

                handleSuccess('Genomes exported successfully')
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
        exportGenomes,
        clearError: () => setError(null),
    }
}
