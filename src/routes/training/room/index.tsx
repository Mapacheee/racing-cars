import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { usePlayerRoomContext } from '../../../lib/contexts/PlayerRoomContext'
import type { PlayerAuth } from '../../../lib/types/auth'

function PlayerRoomGuard() {
    const navigate = useNavigate()
    const { currentRoom, isInitializing } = usePlayerRoomContext()

    useEffect(() => {
        // Wait for initialization to complete before checking room
        if (!isInitializing && !currentRoom) {
            navigate('/training/menu', { replace: true })
        }
    }, [currentRoom, isInitializing, navigate])

    // Show loading while initializing
    if (isInitializing) {
        return (
            <div className="min-h-screen w-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="text-lg text-secondary">Cargando...</div>
                </div>
            </div>
        )
    }

    // Don't render room if no current room (after initialization)
    if (!currentRoom) {
        return null
    }

    return <PlayerRoomContent />
}

function PlayerRoomContent() {
    const navigate = useNavigate()
    const { auth, clearAuth } = useAuth<PlayerAuth>()
    const { currentRoom, participants, roomError, leaveRoom, isConnected } =
        usePlayerRoomContext()

    useEffect(() => {
        document.title = `Sala de Competición - Carrera neuronal 🏎️🧠`
    }, [])

    function handleLogout() {
        clearAuth()
        navigate('/')
    }

    async function handleLeaveRoom() {
        try {
            await leaveRoom()
            navigate('/training/menu')
        } catch (error) {
            console.error('Failed to leave room:', error)
            // Force navigation even if leave fails
            navigate('/training/menu')
        }
    }

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background relative">
            {/* Room Error */}
            {roomError && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md shadow-lg">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Error:</span>
                            <span className="text-sm">{roomError}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary text-center">
                    Sala de competición
                </h1>
            </div>

            {/* Main Menu Card */}
            <div className="w-full max-w-4xl bg-white/80 rounded-xl shadow-lg border border-accent overflow-hidden">
                {/* Header */}
                <div className="bg-background border-b border-accent p-6 text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">
                        Sala: {currentRoom?.id || 'Cargando...'}
                    </h2>
                    <p className="text-secondary">
                        {participants.length} jugadores conectados
                    </p>
                    {currentRoom && (
                        <p className="text-xs text-secondary mt-1">
                            Estado: {currentRoom.status}
                        </p>
                    )}
                </div>

                {/* Players List */}
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4 text-center">
                        Jugadores en la sala
                    </h3>

                    <div className="max-h-80 overflow-y-auto border border-accent rounded-md bg-background">
                        <div className="p-4 space-y-3">
                            {participants.length === 0 ? (
                                <div className="text-center text-secondary py-8">
                                    {!currentRoom
                                        ? 'Cargando sala...'
                                        : 'No hay otros jugadores en la sala'}
                                </div>
                            ) : (
                                participants.map(
                                    (participant: any, index: number) => (
                                        <div
                                            key={participant.userId}
                                            className="flex items-center justify-between p-3 bg-white/60 rounded-md border border-accent hover:bg-white/80 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="font-medium text-primary">
                                                    {participant.username}
                                                </span>
                                                {participant.username ===
                                                    auth.username && (
                                                    <span className="px-2 py-1 bg-accent text-secondary text-xs rounded-full font-medium">
                                                        Tú
                                                    </span>
                                                )}
                                                {participant.aiGeneration && (
                                                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                                        Gen{' '}
                                                        {
                                                            participant.aiGeneration
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-background border-t border-accent p-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={handleLeaveRoom}
                            disabled={!isConnected}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium 
                                     hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Salir de la Sala
                        </button>

                        {!isConnected && (
                            <div className="flex items-center gap-2 text-orange-600">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-sm">Reconectando...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Footer */}
                <div className="bg-accent/30 px-6 py-3">
                    <p className="text-center text-xs text-secondary">
                        Estado de conexión:{' '}
                        {isConnected ? (
                            <span className="text-green-600 font-medium">
                                Conectado
                            </span>
                        ) : (
                            <span className="text-red-600 font-medium">
                                Desconectado
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Logout Button Fixed to Lower Right */}
            <button
                onClick={handleLogout}
                className="fixed right-6 bottom-6 border-1 z-50 w-auto rounded-md px-4 py-3 font-medium text-secondary hover:text-secondary shadow-none transition-colors focus:outline-none focus:ring-2 focus:ring-secondary bg-transparent border-secondary"
            >
                Cerrar sesión
            </button>
        </div>
    )
}

export default function PlayerRoom() {
    return <PlayerRoomGuard />
}
