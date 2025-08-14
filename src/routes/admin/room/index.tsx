import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { useAdminRoomContext } from '../../../lib/contexts/AdminRoomContext'
import type { AdminAuth } from '../../../lib/types/auth'
import {
    FaTrash,
    FaChartBar,
    FaPlay,
    FaBroom,
    FaPlus,
    FaWifi,
    FaExclamationTriangle,
} from 'react-icons/fa'

export default function AdminRoom() {
    const navigate = useNavigate()
    const { clearAuth } = useAuth<AdminAuth>()

    // Use the admin room context instead of the hook
    const {
        isConnected,
        connectionError,
        currentRoom,
        participants,
        isCreatingRoom,
        isStartingRace,
        isClosingRoom,
        roomError,
        createRoom,
        startRace,
        closeRoom,
        removeParticipant,
        clearErrors,
    } = useAdminRoomContext()

    useEffect(() => {
        document.title = 'Administración de Sala - Carrera neuronal 🏎️🧠'
    }, [])

    function handleLogout() {
        clearAuth()
        navigate('/admin')
    }

    async function handleDeletePlayer(participantId: string) {
        try {
            await removeParticipant(participantId)
        } catch (error) {
            console.error('Failed to remove participant:', error)
        }
    }

    function handleShowStats(participantId: string) {
        // TODO: Implement stats functionality
        console.log(`Showing stats for participant ${participantId}`)
    }

    async function handleStartRace() {
        if (!currentRoom) return

        try {
            await startRace()
        } catch (error) {
            console.error('Failed to start race:', error)
        }
    }

    async function handleNewRoom() {
        try {
            clearErrors()
            await createRoom(10) // Max 10 participants
        } catch (error) {
            console.error('Failed to create room:', error)
        }
    }

    async function handleClearRoom() {
        if (!currentRoom) return

        try {
            await closeRoom()
        } catch (error) {
            console.error('Failed to close room:', error)
        }
    }

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background relative">
            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary text-center">
                    Administración de sala
                </h1>
            </div>

            {/* Connection Status */}
            {!isConnected && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-md">
                    <FaExclamationTriangle className="text-yellow-600" />
                    <span className="text-yellow-800 text-sm">
                        {connectionError || 'Conectando al servidor...'}
                    </span>
                </div>
            )}

            {/* Room Error */}
            {roomError && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-md">
                    <FaExclamationTriangle className="text-red-600" />
                    <span className="text-red-800 text-sm">{roomError}</span>
                </div>
            )}

            {/* Main Menu */}
            <div className="w-full max-w-5xl bg-white/80 rounded-xl shadow-lg border border-accent overflow-hidden">
                {/* Room Number Header */}
                <div className="flex flex-col items-center justify-center p-6 border-b border-accent bg-background">
                    <div className="text-lg text-secondary font-medium">
                        Sala Número
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {currentRoom?.id || 'Sin sala'}
                    </div>
                    <div className="text-sm text-secondary mt-2 flex items-center gap-2">
                        <span>{participants.length} jugadores conectados</span>
                        {isConnected ? (
                            <FaWifi
                                className="text-green-500"
                                title="Conectado"
                            />
                        ) : (
                            <FaExclamationTriangle
                                className="text-red-500"
                                title="Desconectado"
                            />
                        )}
                    </div>
                    {currentRoom && (
                        <div className="text-xs text-secondary mt-1">
                            Estado: {currentRoom.status}
                        </div>
                    )}
                </div>

                {/* Players Table */}
                <div className="p-6">
                    <div className="bg-background rounded-lg border border-accent overflow-hidden">
                        <div className="max-h-80 overflow-y-auto">
                            {participants.length === 0 ? (
                                <div className="p-8 text-center text-secondary">
                                    {!currentRoom
                                        ? 'No hay sala activa. Presiona "Nueva Sala" para crear una.'
                                        : 'No hay jugadores en la sala'}
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-accent/20 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-primary">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-primary">
                                                Jugador
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-primary">
                                                Generación IA
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-medium text-primary">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            void console.log(
                                                'participants',
                                                participants
                                            )
                                        }
                                        {participants.map(
                                            (participant, index) => (
                                                <tr
                                                    key={participant.userId}
                                                    className="border-b border-accent/30 hover:bg-accent/10 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-sm text-secondary">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-primary">
                                                        {participant.username}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                                                            Gen{' '}
                                                            {
                                                                participant.aiGeneration
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleShowStats(
                                                                        participant.userId
                                                                    )
                                                                }
                                                                className="p-1.5 rounded text-info hover:bg-info/10 transition-colors focus:outline-none focus:ring-2 focus:ring-info/20"
                                                                title="Ver estadísticas"
                                                            >
                                                                <FaChartBar
                                                                    size={14}
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeletePlayer(
                                                                        participant.userId
                                                                    )
                                                                }
                                                                className="p-1.5 rounded text-error hover:bg-error/10 transition-colors focus:outline-none focus:ring-2 focus:ring-error/20"
                                                                title="Eliminar jugador"
                                                            >
                                                                <FaTrash
                                                                    size={14}
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Start Race Button */}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleStartRace}
                            disabled={
                                participants.length === 0 ||
                                !currentRoom ||
                                isStartingRace
                            }
                            className="flex items-center gap-2 px-6 py-3 font-medium bg-primary text-white hover:bg-secondary hover:text-background disabled:bg-accent/50 disabled:text-secondary disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-secondary rounded-md"
                        >
                            <FaPlay size={16} />
                            {isStartingRace
                                ? 'Iniciando...'
                                : 'Iniciar Carrera'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Back to Menu Button */}
            <div className="mt-6 flex justify-center">
                <Link
                    to="/admin/menu"
                    className="rounded-md px-3 py-2 font-medium text-xs text-secondary bg-white/60 border border-accent shadow-sm hover:bg-accent hover:text-primary transition-colors"
                >
                    Volver al Menú
                </Link>
            </div>

            {/* Bottom Right Action Buttons */}
            <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-50">
                <button
                    onClick={handleNewRoom}
                    disabled={isCreatingRoom || !isConnected}
                    className="flex items-center gap-2 rounded-md px-4 py-3 font-medium text-secondary hover:text-secondary shadow-none transition-colors focus:outline-none focus:ring-2 focus:ring-secondary bg-white/60 border border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaPlus size={14} />
                    {isCreatingRoom ? 'Creando...' : 'Nueva Sala'}
                </button>
                <button
                    onClick={handleClearRoom}
                    disabled={!currentRoom || isClosingRoom}
                    className="flex items-center gap-2 rounded-md px-4 py-3 font-medium text-warning hover:text-warning shadow-none transition-colors focus:outline-none focus:ring-2 focus:ring-warning bg-white/60 border border-warning disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaBroom size={14} />
                    {isClosingRoom ? 'Cerrando...' : 'Limpiar Sala'}
                </button>
                <button
                    onClick={handleLogout}
                    className="rounded-md px-4 py-3 font-medium text-secondary hover:text-secondary shadow-none transition-colors focus:outline-none focus:ring-2 focus:ring-secondary bg-transparent border border-secondary"
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    )
}
