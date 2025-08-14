import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/contexts/AuthContext'
import { usePlayerRoomContext } from '../../../lib/contexts/PlayerRoomContext'
import type { PlayerAuth } from '../../../lib/types/auth'
import { useFormik } from 'formik'
import { useEffect } from 'react'

export default function TrainingMenu() {
    const navigate = useNavigate()
    const { auth, clearAuth } = useAuth<PlayerAuth>()
    const {
        isConnected,
        connectionError,
        currentRoom,
        isInRoom,
        isJoiningRoom,
        roomError,
        joinRoom,
        clearErrors,
    } = usePlayerRoomContext()

    useEffect(() => {
        document.title = 'Sala de Entrenamiento - Carrera neuronal 🏎️🧠'

        // If already in a room, navigate to room page
        if (isInRoom && currentRoom) {
            navigate('/training/room')
        }
    }, [isInRoom, currentRoom, navigate])

    const roomFormik = useFormik({
        initialValues: { roomNumber: '' },
        validate: values => {
            const errors: Record<string, string> = {}
            if (!/^[0-9]{4}$/.test(values.roomNumber)) {
                errors['roomNumber'] = 'El número de sala debe ser de 4 dígitos'
            }
            return errors
        },
        onSubmit: async ({ roomNumber }) => {
            try {
                clearErrors()
                await joinRoom(roomNumber)
                // Navigation will happen automatically via useEffect above
            } catch (error) {
                console.error('Failed to join room:', error)
                // Error is already set in the context
            }
        },
        validateOnChange: true,
        validateOnBlur: true,
    })

    // Only allow numbers in room number
    const handleRoomNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '')
        roomFormik.setFieldValue('roomNumber', value)
    }

    function handleLogout() {
        clearAuth()
        window.location.reload()
    }

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-background relative">
            {/* Connection Error */}
            {connectionError && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md shadow-lg">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">
                                Error de conexión:
                            </span>
                            <span className="text-sm">{connectionError}</span>
                        </div>
                    </div>
                </div>
            )}

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

            <div className="w-full max-w-3xl bg-white/80 rounded-xl shadow-lg border border-accent flex flex-col md:flex-row overflow-hidden">
                {/* User Info Column */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 border-b md:border-b-0 md:border-r border-accent bg-background">
                    <div className="text-lg text-secondary font-medium">
                        Usuario
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {auth.username}
                    </div>
                    <div className="text-base text-secondary mt-4">
                        Generación de IA
                    </div>
                    <div className="text-lg font-semibold text-primary">
                        Gen {auth.aiGeneration}
                    </div>
                </div>
                {/* Actions Column */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                    <Link
                        to="/training/simulation"
                        className="w-full text-center rounded-md px-4 py-3 font-medium bg-primary text-white hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                        {auth.aiGeneration === 1
                            ? 'Empezar Entrenamiento'
                            : 'Continuar Entrenamiento'}
                    </Link>

                    {/* Room Number Input Form */}
                    <form onSubmit={roomFormik.handleSubmit} className="w-full">
                        <div className="text-center text-secondary text-sm font-medium mb-3">
                            Unirse a una sala
                        </div>
                        <div className="relative">
                            <input
                                id="roomNumber"
                                name="roomNumber"
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="Número de sala (4 dígitos)"
                                className={`text-left w-full pl-3 pr-24 py-3 rounded-md border border-secondary bg-transparent text-secondary font-medium outline-none focus:ring-2 focus:ring-secondary transition ${
                                    roomFormik.errors.roomNumber &&
                                    roomFormik.touched.roomNumber
                                        ? 'border-error'
                                        : ''
                                }`}
                                value={roomFormik.values.roomNumber}
                                onChange={handleRoomNumberChange}
                                onBlur={roomFormik.handleBlur}
                                disabled={isJoiningRoom || !isConnected}
                            />
                            <button
                                type="submit"
                                className="absolute right-1 top-1 bottom-1 px-3 rounded-sm bg-secondary text-background font-medium text-sm hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={
                                    !roomFormik.isValid ||
                                    !roomFormik.values.roomNumber ||
                                    isJoiningRoom ||
                                    !isConnected
                                }
                            >
                                {isJoiningRoom ? '...' : 'Entrar'}
                            </button>
                        </div>
                        {roomFormik.errors.roomNumber &&
                            roomFormik.touched.roomNumber && (
                                <span className="text-error text-xs mt-2 block text-center">
                                    {roomFormik.errors.roomNumber}
                                </span>
                            )}
                    </form>
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
