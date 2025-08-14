import type { JSX } from 'react/jsx-runtime'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { useAdminRoomContext } from '../../../lib/contexts/AdminRoomContext'
import type { AdminAuth } from '../../../lib/types/auth'
import { Link } from 'react-router-dom'
import { FaExclamationTriangle, FaSpinner } from 'react-icons/fa'

export default function AdminMenu(): JSX.Element {
    const { auth, clearAuth } = useAuth<AdminAuth>()
    const {
        connectionError,
        currentRoom,
        participants,
        isCreatingRoom,
        roomError,
    } = useAdminRoomContext()

    function handleLogout() {
        clearAuth()
        window.location.reload()
    }

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background relative">
            {/* Connection Status */}
            {connectionError && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-md">
                    <FaExclamationTriangle className="text-red-600" />
                    <span className="text-red-800 text-sm">
                        {connectionError}
                    </span>
                </div>
            )}

            {/* Room Error */}
            {roomError && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-md">
                    <FaExclamationTriangle className="text-yellow-600" />
                    <span className="text-yellow-800 text-sm">{roomError}</span>
                </div>
            )}

            <div className="w-full max-w-3xl bg-white/80 rounded-xl shadow-lg border border-accent flex flex-col md:flex-row overflow-hidden">
                {/* User Info Column */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 border-b md:border-b-0 md:border-r border-accent bg-background">
                    <div className="text-lg text-secondary font-medium">
                        Admin
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {auth.username}
                    </div>

                    <div className="text-base text-secondary mt-4">
                        Jugadores en la sala
                    </div>
                    <div className="text-lg font-semibold text-primary">
                        {participants.length} jugadores
                    </div>

                    {/* Room Creation Status */}
                    {isCreatingRoom && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <FaSpinner className="animate-spin" />
                            <span>Creando sala...</span>
                        </div>
                    )}
                </div>
                {/* Actions Column */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                    <Link
                        to="/admin/track-editor"
                        className="w-full text-center rounded-md px-4 py-3 font-medium bg-primary text-white hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                        🛠️ Editor de Pista
                    </Link>
                    <Link
                        to="/admin/room"
                        className="w-full text-center rounded-md px-4 py-3 font-medium border border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                        🏁 Administrar Sala
                    </Link>
                    {/* <Link
                        to="/admin/dashboard"
                        className="text-center rounded-md text-sm px-3 py-1 font-extralight bg-primary text-white hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                        Administración avanzada
                    </Link> */}
                </div>
            </div>
            {/* Room Number Display - Centered below main menu */}
            <div className="mt-6 flex justify-center">
                <div className="rounded-md px-3 py-2 font-medium text-xs text-secondary bg-white/60 border border-accent shadow-sm">
                    {currentRoom
                        ? `Sala: ${currentRoom.id}`
                        : 'Sin sala activa'}
                </div>
            </div>
            {/* Logout Button Fixed to Lower Right */}
            <button
                onClick={handleLogout}
                className="fixed right-6 bottom-6 border-1 z-50 w-auto rounded-md px-4 py-3 font-medium  text-secondary hover:text-secondary shadow-none transition-colors focus:outline-none focus:ring-2 focus:ring-secondary bg-transparent border-secondary"
            >
                Cerrar sesión
            </button>
        </div>
    )
}
