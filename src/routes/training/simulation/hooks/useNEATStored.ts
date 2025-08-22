import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../../../lib/contexts/AuthContext'
import {
    tryCreateAiModel,
    tryGetLatestGeneration,
    tryGetGeneration,
    tryResetAllGenerations,
    tryDeleteGeneration,
    type CreateAiModelDto,
    type AIModelResponse,
    type NEATConfig,
} from '../../../../lib/services/player/aiModels.service'
import type { PlayerAuth } from '../../../../lib/types/auth'

interface UseNEATStoredOptions {
    onError?: (error: Error) => void
    onSuccess?: (message: string) => void
}

export function useNEATStored(options: UseNEATStoredOptions = {}) {
    const { auth, isLoading } = useAuth<PlayerAuth>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        console.log('$$$$ NEAT: isLoading: ', isLoading)
    }, [isLoading, auth])

    const handleError = useCallback(
        (error: Error) => {
            const message = error.message || 'An unknown error occurred'
            setError(message)
            console.error('NEAT Storage API Error:', error)
            options.onError?.(error)
        },
        [options]
    )

    const handleSuccess = useCallback(
        (message: string) => {
            setError(null)
            console.log('NEAT Storage API Success:', message)
            options.onSuccess?.(message)
        },
        [options]
    )

    const saveGeneration = useCallback(
        async (
            generationNumber: number,
            neatExportData: any,
            neatConfig: NEATConfig
        ): Promise<AIModelResponse | null> => {
            setLoading(true)
            try {
                const createDto: CreateAiModelDto = {
                    networkData: JSON.stringify(neatExportData),
                    neatConfig,
                    metadata: {
                        nodes: Array.isArray(neatExportData)
                            ? neatExportData.reduce(
                                  (sum, net) => sum + (net.nodes?.length || 0),
                                  0
                              )
                            : neatExportData.nodes?.length || 0,
                        connections: Array.isArray(neatExportData)
                            ? neatExportData.reduce(
                                  (sum, net) =>
                                      sum + (net.connections?.length || 0),
                                  0
                              )
                            : neatExportData.connections?.length || 0,
                        species: Array.isArray(neatExportData)
                            ? neatExportData.length
                            : 1,
                        isElite: false,
                    },
                }

                console.log('!!!! NEAT export data:', createDto)

                const savedGeneration = await tryCreateAiModel(
                    auth.token,
                    createDto
                )

                const networkCount = Array.isArray(neatExportData)
                    ? neatExportData.length
                    : 'unknown'
                handleSuccess(
                    `Generation ${generationNumber} saved with ${networkCount} networks`
                )
                return savedGeneration
            } catch (error) {
                handleError(error as Error)
                return null
            } finally {
                setLoading(false)
            }
        },
        [auth, handleError, handleSuccess]
    )

    const loadLatestGeneration = useCallback(async (): Promise<{
        neatExportData: any
        generationNumber: number
        neatConfig: NEATConfig
    } | null> => {
        console.log('📡 Starting loadLatestGeneration API call...')
        setLoading(true)
        try {
            console.log(
                '🌐 Calling tryGetLatestGeneration with token:',
                auth.token ? 'present' : 'missing'
            )
            const result = await tryGetLatestGeneration(auth.token)

            console.log('📦 Raw API response received:', {
                hasResult: !!result,
                resultType: typeof result,
                generationNumber: result?.generationNumber,
                networksType: typeof result?.networks,
                networksIsArray: Array.isArray(result?.networks),
                networksLength: result?.networks?.length,
                totalNetworks: result?.totalNetworks,
            })

            if (result) {
                console.log('🔍 Backend response structure:', {
                    generationNumber: result.generationNumber,
                    networksType: typeof result.networks,
                    networksIsArray: Array.isArray(result.networks),
                    networksLength: result.networks?.length,
                    totalNetworks: result.totalNetworks,
                    firstNetworkSample: result.networks?.[0],
                })

                if (
                    !result.networks ||
                    !Array.isArray(result.networks) ||
                    result.networks.length === 0
                ) {
                    console.log(
                        '🆕 No existing generations found in backend - this is expected for new users'
                    )
                    return null
                }

                const generationRecord = result.networks[0]

                const neatExportData = generationRecord.networkData

                if (!neatExportData || typeof neatExportData !== 'object') {
                    console.error(
                        'networkData is not a valid object:',
                        neatExportData
                    )
                    handleError(
                        new Error(
                            `Generation ${result.generationNumber || 'undefined'} networkData is not a valid NEAT export object`
                        )
                    )
                    return null
                }

                handleSuccess(
                    `Latest generation ${result.generationNumber} loaded successfully`
                )

                return {
                    neatExportData,
                    generationNumber: result.generationNumber,
                    neatConfig:
                        generationRecord.neatConfig || getDefaultNEATConfig(),
                }
            } else {
                console.log(
                    '📭 API returned null/empty result - no generations exist in database'
                )
                handleSuccess('No saved generations found')
                return null
            }
        } catch (error) {
            handleError(error as Error)
            return null
        } finally {
            setLoading(false)
        }
    }, [auth, handleError, handleSuccess])

    const loadGeneration = useCallback(
        async (
            generationNumber: number
        ): Promise<{
            neatExportData: any
            generationNumber: number
            neatConfig: NEATConfig
        } | null> => {
            setLoading(true)
            try {
                const result = await tryGetGeneration(
                    auth.token,
                    generationNumber
                )

                if (
                    !result.networks ||
                    !Array.isArray(result.networks) ||
                    result.networks.length === 0
                ) {
                    console.log(
                        `🆕 No networks found for generation ${generationNumber} - this is expected for new generations`
                    )
                    return null
                }

                const generationRecord = result.networks[0]

                const neatExportData = generationRecord.networkData

                if (!neatExportData || typeof neatExportData !== 'object') {
                    console.error(
                        'networkData is not a valid object:',
                        neatExportData
                    )
                    handleError(
                        new Error(
                            `Generation ${generationNumber} networkData is not a valid NEAT export object`
                        )
                    )
                    return null
                }

                handleSuccess(
                    `Generation ${generationNumber} loaded successfully`
                )

                return {
                    neatExportData,
                    generationNumber: result.generationNumber,
                    neatConfig:
                        generationRecord.neatConfig || getDefaultNEATConfig(),
                }
            } catch (error) {
                handleError(error as Error)
                return null
            } finally {
                setLoading(false)
            }
        },
        [auth, handleError, handleSuccess]
    )

    const resetAllGenerations = useCallback(async (): Promise<boolean> => {
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

    const deleteGeneration = useCallback(
        async (generationNumber: number): Promise<boolean> => {
            setLoading(true)
            try {
                await tryDeleteGeneration(auth.token, generationNumber)
                handleSuccess(
                    `Generation ${generationNumber} deleted successfully`
                )
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

    const hasAnyGenerations = useCallback(async (): Promise<boolean> => {
        try {
            const latest = await tryGetLatestGeneration(auth.token)
            return latest !== null
        } catch (error) {
            console.warn('Error checking for existing generations:', error)
            return false
        }
    }, [auth])

    return {
        loading: loading || isLoading,
        error,
        isAuthReady: !isLoading,
        saveGeneration,
        loadLatestGeneration,
        loadGeneration,
        resetAllGenerations,
        deleteGeneration,
        hasAnyGenerations,
        clearError: () => setError(null),
    }
}

function getDefaultNEATConfig(): NEATConfig {
    return {
        populationSize: 20,
        mutationRate: 0.55,
        elitism: 3,
        inputNodes: 6,
        outputNodes: 3,
    }
}
