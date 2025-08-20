import { Navigate, Outlet } from 'react-router-dom'
import type { JSX } from 'react'
import { useAuth } from '../contexts/AuthContext'

type ProtectedRouteProps = {
    redirectIfLoggedIn?: boolean
}

export default function ProtectedRoute({
    redirectIfLoggedIn = false,
}: ProtectedRouteProps): JSX.Element {
    const { isAdmin, isPlayer, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (redirectIfLoggedIn && isAdmin()) {
        return <Navigate to="/admin/menu" replace />
    }

    if (!redirectIfLoggedIn && isAdmin()) {
        // If already logged in as admin, redirect from login to admin menu
        return <Outlet />
    }

    if (redirectIfLoggedIn && isPlayer()) {
        // If already logged in, redirect from login to menu
        return <Navigate to="/training/menu" replace />
    }

    if (!redirectIfLoggedIn && !isPlayer()) {
        // If not logged in, redirect to login
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
