import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Race } from '../../../lib/types/race'
import { AdminRaceService } from '../../../lib/services/admin/race.service'
import type { AdminAuth } from '../../../lib/types/auth'
import { useAuth } from '../../../lib/contexts/AuthContext'

export function RaceDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [race, setRace] = useState<Race | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { auth } = useAuth<AdminAuth>()

    useEffect(() => {
        const loadRace = async () => {
            if (!id) return

            try {
                setLoading(true)
                const raceData = await AdminRaceService.getRace(id, auth.token)
                setRace(raceData)
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'error al cargar la carrera'
                )
            } finally {
                setLoading(false)
            }
        }

        loadRace()
    }, [id])

    const handleDelete = async () => {
        if (!id || !window.confirm('quieres borrar la carrera?')) {
            return
        }

        try {
            setLoading(true)
            await AdminRaceService.deleteRace(id, auth.token)
            navigate('/admin/races')
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'error al borrar la carrera'
            )
        } finally {
            setLoading(false)
        }
    }

    if (loading)
        return (
            <div className="flex justify-center items-center">Loading...</div>
        )
    if (error) return <div className="text-red-500">{error}</div>
    if (!race) return <div className="text-gray-600">carrera no encontrada</div>

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                {/* header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            Race {race.id}
                        </h2>
                        <p className="text-sm text-gray-600">
                            Creado: {new Date(race.createdAt).toLocaleString()}
                        </p>
                        {race.createdAt !== race.updatedAt && (
                            <p className="text-sm text-gray-600">
                                ultima vez:{' '}
                                {new Date(race.updatedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-sm ${
                            race.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : race.status === 'in-progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : race.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                        {race.status}
                    </span>
                </div>

                {/* config*/}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">
                            configuracion de carrera
                        </h3>
                        <div className="space-y-2">
                            <p>
                                <span className="font-medium">
                                    numero de vueltas:
                                </span>{' '}
                                {race.raceConfig.numberOfLaps}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">
                            condiciones de carrera
                        </h3>
                        <div className="space-y-2">
                            <p>
                                <span className="font-medium">lluvia:</span>{' '}
                                {race.raceConditions.weather}
                            </p>
                            <p>
                                <span className="font-medium">dificultad:</span>{' '}
                                {race.raceConditions.difficulty}
                            </p>
                            <p>
                                <span className="font-medium">
                                    participantes:
                                </span>{' '}
                                {race.raceConditions.numberOfParticipants}
                            </p>
                        </div>
                    </div>
                </div>

                {/* resultados */}
                {race.results && race.results.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">
                            Resultados
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left">
                                            Posición
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            Modelo de IA
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Mejor Vuelta
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Tiempo Total
                                        </th>
                                        <th className="px-4 py-2 text-right">
                                            Velocidad Promedio
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {race.results.map(result => (
                                        <tr
                                            key={result.aiModelId}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-2">
                                                {result.position}
                                            </td>
                                            <td className="px-4 py-2">
                                                {result.aiModelId}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {result.bestLapTime.toFixed(3)}s
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {result.totalTime.toFixed(3)}s
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {result.averageSpeed.toFixed(2)}{' '}
                                                km/h
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Acciones */}
                <div className="flex space-x-4 justify-end mt-8">
                    <button
                        onClick={() => navigate('/admin/races')}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Volver a la lista
                    </button>
                    {race.status === 'pending' && (
                        <>
                            <button
                                onClick={() =>
                                    navigate(`/admin/races/${race.id}/edit`)
                                }
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Editar carrera
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Borrar carrera
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
