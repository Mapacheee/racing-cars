import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminRoomContext } from '../../../lib/contexts/AdminRoomContext'
import { SimulationCanvas, BaseScene } from '../../../lib/components/shared'
import { regenerateMainTrack } from '../../../lib/racing/track'
import type { Track } from '../../../lib/racing/track/types'

function CompetitionSettingsMenu() {
    const navigate = useNavigate()

    return (
        <div className="absolute top-4 left-4 z-50 flex flex-col gap-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Controles de Competición
                </h3>

                <div className="flex flex-col gap-2">
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                        onClick={() => {
                            // TODO: Implement start competition
                            console.log('Starting competition...')
                        }}
                    >
                        Iniciar Competición
                    </button>

                    <button
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors font-medium"
                        onClick={() => {
                            // TODO: Implement restart competition
                            console.log('Restarting competition...')
                        }}
                    >
                        Reiniciar Competición
                    </button>

                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                        onClick={() => {
                            // TODO: Implement create new competition
                            console.log('Creating new competition...')
                        }}
                    >
                        Nueva Competición
                    </button>

                    <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
                        onClick={() => navigate('/admin/room')}
                    >
                        Volver a Sala
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function RacingCompetition() {
    const { currentRoom, participants } = useAdminRoomContext()
    const [track, setTrack] = useState<Track | null>(null)

    // Generate track from room seed or default
    const competitionTrack = useMemo(() => {
        if (!currentRoom) {
            // Use default seed if no room
            return regenerateMainTrack(12345)
        }

        // Try to get seed from room data or use room ID as seed
        const seed = currentRoom.raceConfig?.trackId
            ? parseInt(currentRoom.raceConfig.trackId)
            : parseInt(currentRoom.id) || 12345

        console.log(`🏁 Generating competition track with seed: ${seed}`)
        return regenerateMainTrack(seed)
    }, [currentRoom])

    useEffect(() => {
        setTrack(competitionTrack)
    }, [competitionTrack])

    useEffect(() => {
        document.title = 'Competición de Carrera - Administración'
    }, [])

    if (!track) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        Generando pista de competición...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 w-screen h-screen bg-cyan-200">
            <CompetitionSettingsMenu />

            {/* Competition Info */}
            <div className="absolute top-4 right-4 z-50">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Información de Competición
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>
                            <strong>Sala:</strong>{' '}
                            {currentRoom?.id || 'Sin sala'}
                        </p>
                        <p>
                            <strong>Participantes:</strong>{' '}
                            {participants.length}
                        </p>
                        <p>
                            <strong>Estado:</strong>{' '}
                            {currentRoom?.status || 'Desconocido'}
                        </p>
                    </div>
                </div>
            </div>

            <SimulationCanvas>
                <BaseScene
                    track={track}
                    settings={{
                        showWaypoints: false,
                        showWalls: true,
                        showTrack: true,
                    }}
                    enablePhysics={true}
                    enableControls={true}
                >
                    {/* TODO: Add AI cars for each participant */}
                </BaseScene>
            </SimulationCanvas>
        </div>
    )
}
