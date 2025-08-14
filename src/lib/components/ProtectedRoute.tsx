import { Navigate, Outlet } from 'react-router-dom'
import type { JSX } from 'react'
import { useAuth } from '../contexts/AuthContext'

type ProtectedRouteProps = {
    redirectIfLoggedIn?: boolean
}

export default function ProtectedRoute({
    redirectIfLoggedIn = false,
}: ProtectedRouteProps): JSX.Element {
    const { isAdmin, isPlayer } = useAuth()

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
