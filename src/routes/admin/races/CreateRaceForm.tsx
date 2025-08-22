import { useState, useEffect } from 'react'
import { AdminRaceService } from '../../../lib/services/admin/race.service'
import type {
    Track,
    AIModel,
    RaceFormData,
    Weather,
    Difficulty,
} from '../../../lib/types/race'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/contexts/AuthContext'
import type { AdminAuth } from '../../../lib/types/auth'

export function CreateRaceForm() {
    const navigate = useNavigate()
    const [tracks, setTracks] = useState<Track[]>([])
    const [aiModels, setAIModels] = useState<AIModel[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { auth } = useAuth<AdminAuth>()

    const [formData, setFormData] = useState<RaceFormData>({
        trackId: '',
        aiModels: [],
        raceConditions: {
            weather: 'sunny' as Weather,
            difficulty: 'medium' as Difficulty,
            numberOfParticipants: 2,
        },
        raceConfig: {
            numberOfLaps: 3,
        },
    })

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                const [tracksData, aiModelsData] = await Promise.all([
                    AdminRaceService.getTracks(auth.token),
                    AdminRaceService.getAIModels(auth.token),
                ])
                setTracks(tracksData)
                setAIModels(aiModelsData)
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Error al cargar datos'
                )
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            await AdminRaceService.createRace(formData, auth.token)
            navigate('/admin/races')
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'error al crear la carrera'
            )
        } finally {
            setLoading(false)
        }
    }

    if (loading)
        return (
            <div className="min-h-screen w-screen flex items-center justify-center bg-background">
                <div className="text-lg text-secondary font-medium">
                    Loading...
                </div>
            </div>
        )

    if (error) {
        return (
            <div className="min-h-screen w-screen flex items-center justify-center bg-background relative">
                <div className="w-full max-w-3xl bg-white/80 rounded-xl shadow-lg border border-accent flex flex-col overflow-hidden">
                    {/* Error Message */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                        <div className="text-lg text-error/80 font-medium text-center">
                            Error
                        </div>
                        <div className="text-xl font-bold text-error text-center max-w-md">
                            {error}
                        </div>
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-full max-w-xs text-center rounded-md px-4 py-3 font-medium bg-primary text-white hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                        >
                            Volver al Menú
                        </button>
                        <button
                            onClick={() => {
                                setError(null)

                                const loadData = async () => {
                                    try {
                                        setLoading(true)
                                        const [tracksData, aiModelsData] =
                                            await Promise.all([
                                                AdminRaceService.getTracks(
                                                    auth.token
                                                ),
                                                AdminRaceService.getAIModels(
                                                    auth.token
                                                ),
                                            ])
                                        setTracks(tracksData)
                                        setAIModels(aiModelsData)
                                    } catch (err) {
                                        setError(
                                            err instanceof Error
                                                ? err.message
                                                : 'Error al cargar datos'
                                        )
                                    } finally {
                                        setLoading(false)
                                    }
                                }
                                loadData()
                            }}
                            className="w-full max-w-xs text-center rounded-md px-4 py-3 font-medium border border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 max-w-2xl mx-auto p-6"
        >
            <h2 className="text-2xl font-bold mb-6">Crear carrera</h2>

            {/* Track Selection */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Seleccionar pista
                </label>
                <select
                    value={formData.trackId}
                    onChange={e =>
                        setFormData({ ...formData, trackId: e.target.value })
                    }
                    className="w-full p-2 border rounded-md"
                    required
                >
                    <option value="">Select a track...</option>
                    {tracks.map(track => (
                        <option key={track.id} value={track.id}>
                            {track.name} - {track.length}m
                        </option>
                    ))}
                </select>
            </div>

            {/* ia seleccion */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Seleccionar modelos de IA
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                    {aiModels.map(model => (
                        <div key={model.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={model.id}
                                checked={formData.aiModels.includes(model.id)}
                                onChange={e => {
                                    const newModels = e.target.checked
                                        ? [...formData.aiModels, model.id]
                                        : formData.aiModels.filter(
                                              id => id !== model.id
                                          )
                                    setFormData({
                                        ...formData,
                                        aiModels: newModels,
                                    })
                                }}
                                className="mr-2"
                            />
                            <label htmlFor={model.id}>
                                {model.name} - by {model.username}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Race Conditions */}
            <div>
                <h3 className="text-lg font-medium mb-3">Race Conditions</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Weather
                        </label>
                        <select
                            value={formData.raceConditions.weather}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    raceConditions: {
                                        ...formData.raceConditions,
                                        weather: e.target.value as Weather,
                                    },
                                })
                            }
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="sunny">Sunny</option>
                            <option value="cloudy">Cloudy</option>
                            <option value="rainy">Rainy</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Dificultad
                        </label>
                        <select
                            value={formData.raceConditions.difficulty}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    raceConditions: {
                                        ...formData.raceConditions,
                                        difficulty: e.target
                                            .value as Difficulty,
                                    },
                                })
                            }
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="easy">Fácil</option>
                            <option value="medium">Medio</option>
                            <option value="hard">Difícil</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Race Configuration */}
            <div>
                <h3 className="text-lg font-medium mb-3">
                    Configuración de Carrera
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Número de Vueltas
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.raceConfig.numberOfLaps}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    raceConfig: {
                                        ...formData.raceConfig,
                                        numberOfLaps: parseInt(e.target.value),
                                    },
                                })
                            }
                            className="w-full p-2 border rounded-md"
                            required
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
                {loading ? 'Creando...' : 'Crear Carrera'}
            </button>
        </form>
    )
}
