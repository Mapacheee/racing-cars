import { useEffect, useState } from 'react'
import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaTimes,
} from 'react-icons/fa'

interface NotificationProps {
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    duration?: number
    onClose?: () => void
}

export const Notification: React.FC<NotificationProps> = ({
    type,
    message,
    duration = 5000,
    onClose,
}) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false)
                onClose?.()
            }, duration)

            return () => clearTimeout(timer)
        }
        return undefined
    }, [duration, onClose])

    if (!isVisible) return null

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className="text-green-600" />
            case 'error':
                return <FaExclamationTriangle className="text-red-600" />
            case 'warning':
                return <FaExclamationTriangle className="text-yellow-600" />
            case 'info':
            default:
                return <FaInfoCircle className="text-blue-600" />
        }
    }

    const getBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-100 border-green-300'
            case 'error':
                return 'bg-red-100 border-red-300'
            case 'warning':
                return 'bg-yellow-100 border-yellow-300'
            case 'info':
            default:
                return 'bg-blue-100 border-blue-300'
        }
    }

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return 'text-green-800'
            case 'error':
                return 'text-red-800'
            case 'warning':
                return 'text-yellow-800'
            case 'info':
            default:
                return 'text-blue-800'
        }
    }

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-md border ${getBgColor()} shadow-lg max-w-sm`}
        >
            {getIcon()}
            <span className={`text-sm font-medium ${getTextColor()}`}>
                {message}
            </span>
            {onClose && (
                <button
                    onClick={() => {
                        setIsVisible(false)
                        onClose()
                    }}
                    className={`ml-2 ${getTextColor()} hover:opacity-70`}
                >
                    <FaTimes size={12} />
                </button>
            )}
        </div>
    )
}

interface UseNotificationReturn {
    showNotification: (
        type: 'success' | 'error' | 'info' | 'warning',
        message: string,
        duration?: number
    ) => void
    notification: {
        type: 'success' | 'error' | 'info' | 'warning'
        message: string
        id: number
    } | null
    clearNotification: () => void
}

export const useNotification = (): UseNotificationReturn => {
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info' | 'warning'
        message: string
        id: number
    } | null>(null)

    const showNotification = (
        type: 'success' | 'error' | 'info' | 'warning',
        message: string,
        duration = 5000
    ) => {
        const id = Date.now()
        setNotification({ type, message, id })

        if (duration > 0) {
            setTimeout(() => {
                setNotification(null)
            }, duration)
        }
    }

    const clearNotification = () => {
        setNotification(null)
    }

    return {
        showNotification,
        notification,
        clearNotification,
    }
}
