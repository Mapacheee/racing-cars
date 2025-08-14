import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/contexts/AuthContext'
import type { AdminAuth } from '../../../lib/types/auth'
import { useEffect } from 'react'

export function AdminDashboard() {
    const navigate = useNavigate()
    const { clearAuth } = useAuth<AdminAuth>()

    useEffect(() => {
        document.title = 'Panel de Administración - Carrera neuronal 🏎️🧠'
    }, [])

    function handleLogout() {
        clearAuth()
        navigate('/admin')
    }

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background relative">
            <div className="w-full max-w-4xl bg-white/80 rounded-xl shadow-lg border border-accent overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center justify-center p-8 border-b border-accent bg-background">
                    <div className="text-2xl font-bold text-primary mb-2">
                        Admin Dashboard
                    </div>
                    <div className="text-base text-secondary">
                        Panel de administración del sistema
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="p-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Link
                            to="/admin/races"
                            className="flex flex-col items-center justify-center p-6 rounded-md border border-secondary bg-transparent text-secondary hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary min-h-[120px]"
                        >
                            <h3 className="text-lg font-semibold mb-2 text-center">
                                Carreras
                            </h3>
                            <p className="text-sm text-center opacity-80">
                                Administrar carreras, resultados y participantes
                            </p>
                        </Link>

                        {/* Futuros módulos */}
                        <div className="flex flex-col items-center justify-center p-6 rounded-md border border-accent bg-background text-secondary opacity-60 min-h-[120px]">
                            <h3 className="text-lg font-semibold mb-2 text-center">
                                Modelos de IA
                            </h3>
                            <p className="text-sm text-center">
                                Próximamente: Administrar modelos de IA y
                                entrenamientos
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 rounded-md border border-accent bg-background text-secondary opacity-60 min-h-[120px]">
                            <h3 className="text-lg font-semibold mb-2 text-center">
                                Estadísticas
                            </h3>
                            <p className="text-sm text-center">
                                Próximamente: Ver estadísticas y métricas
                            </p>
                        </div>
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
