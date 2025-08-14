import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Race } from '../../../lib/types/race'
import { AdminRaceService } from '../../../lib/services/admin/race.service'

export function RaceList() {
    const [races, setRaces] = useState<Race[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadRaces = async () => {
            try {
                setLoading(true)
                const racesData = await AdminRaceService.getRaces()
                setRaces(racesData)
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'error al cargar las carreras'
                )
            } finally {
                setLoading(false)
            }
        }

        loadRaces()
    }, [])

    const handleDelete = async (id: string) => {
        if (!window.confirm('quieres eliminar la carrera?')) {
            return
        }

        try {
            setLoading(true)
            await AdminRaceService.deleteRace(id)
            setRaces(races.filter(race => race.id !== id))
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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">carreras</h2>
                <Link
                    to="/admin/races/create"
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    crear carrera
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {races.map(race => (
                    <div
                        key={race.id}
                        className="bg-white p-6 rounded-lg shadow-md"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    carrera {race.id}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {new Date(
                                        race.createdAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <span
                                className={`px-2 py-1 rounded-full text-xs ${
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

                        <div className="space-y-2 mb-4">
                            <p>
                                <span className="font-medium">Laps:</span>{' '}
                                {race.raceConfig.numberOfLaps}
                            </p>
                            <p>
                                <span className="font-medium">Weather:</span>{' '}
                                {race.raceConditions.weather}
                            </p>
                            <p>
                                <span className="font-medium">Difficulty:</span>{' '}
                                {race.raceConditions.difficulty}
                            </p>
                            <p>
                                <span className="font-medium">AI Models:</span>{' '}
                                {race.aiModels.length}
                            </p>
                        </div>

                        <div className="flex space-x-2">
                            <Link
                                to={`/admin/races/${race.id}`}
                                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded text-center hover:bg-gray-200"
                            >
                                ver
                            </Link>
                            <button
                                onClick={() => handleDelete(race.id)}
                                className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded hover:bg-red-200"
                            >
                                borrar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {races.length === 0 && (
                <div className="text-center text-gray-600 mt-8">
                    no hay carreras, crea una
                </div>
            )}
        </div>
    )
}
