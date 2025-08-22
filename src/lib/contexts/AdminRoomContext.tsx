import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { racingWebSocketService } from '../services/racing-websocket'
import type { AdminAuth } from '../types/auth'
import type {
    RaceRoom,
    RoomParticipant,
    RaceConfiguration,
    RacePackage,
} from '../types/racing-stream'

interface AdminRoomContextType {
    // Connection state
    isConnected: boolean
    connectionError: string | null

    // Room state
    currentRoom: RaceRoom | null
    participants: RoomParticipant[]
    racePackage: RacePackage | null

    // Loading states
    isCreatingRoom: boolean
    isConfiguringRace: boolean
    isStartingRace: boolean
    isClosingRoom: boolean

    // Error states
    roomError: string | null

    // Room management methods
    createRoom: (maxParticipants?: number) => Promise<void>
    configureRace: (config: RaceConfiguration) => Promise<void>
    startRace: () => Promise<void>
    closeRoom: () => Promise<void>
    removeParticipant: (userId: string) => Promise<void>

    // Utility methods
    clearErrors: () => void
    disconnect: () => void
}

const AdminRoomContext = createContext<AdminRoomContextType | undefined>(
    undefined
)

interface AdminRoomProviderProps {}

export const AdminRoomProvider: React.FC<AdminRoomProviderProps> = () => {
    const { auth } = useAuth<AdminAuth>()

    const [isConnected, setIsConnected] = useState(false)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    const [currentRoom, setCurrentRoom] = useState<RaceRoom | null>(null)
    const [participants, setParticipants] = useState<RoomParticipant[]>([])
    const [racePackage, setRacePackage] = useState<RacePackage | null>(null)

    const [isCreatingRoom, setIsCreatingRoom] = useState(false)
    const [isConfiguringRace, setIsConfiguringRace] = useState(false)
    const [isStartingRace, setIsStartingRace] = useState(false)
    const [isClosingRoom, setIsClosingRoom] = useState(false)

    const [roomError, setRoomError] = useState<string | null>(null)

    useEffect(() => {
        const savedRoom = localStorage.getItem('admin-current-room')
        if (savedRoom) {
            try {
                const room = JSON.parse(savedRoom) as RaceRoom
                setCurrentRoom(room)
                setParticipants(room.participants)
                console.log('🔄 Restored room from localStorage:', room.id)
            } catch (error) {
                console.error(
                    'Failed to restore room from localStorage:',
                    error
                )
                localStorage.removeItem('admin-current-room')
            }
        }
    }, [])

    useEffect(() => {
        try {
            const socket = racingWebSocketService.connect(auth.token)

            socket.on('connect', () => {
                setIsConnected(true)
                setConnectionError(null)
                console.log('🟢 Admin connected to racing server')
            })

            socket.on('disconnect', () => {
                setIsConnected(false)
                console.log('🔴 Admin disconnected from racing server')
            })

            socket.on('connect_error', error => {
                setConnectionError(`Connection failed: ${error.message}`)
                console.error('🔴 Admin connection error:', error)
            })

            setupRoomEventHandlers()
        } catch (error) {
            console.error('Failed to connect to racing server:', error)
            setConnectionError('Failed to initialize WebSocket connection')
        }

        return () => {
            racingWebSocketService.disconnect()
            setIsConnected(false)
        }
    }, [auth.token])

    useEffect(() => {
        if (isConnected && currentRoom) {
            racingWebSocketService.getRoomStatus(
                currentRoom.id,
                room => {
                    setCurrentRoom(room)
                    setParticipants(room.participants)
                    console.log('🔄 Room status updated:', room.id)
                },
                error => {
                    console.log('❌ Room no longer exists on server:', error)
                    setCurrentRoom(null)
                    setParticipants([])
                    localStorage.removeItem('admin-current-room')
                }
            )
        }
    }, [isConnected, currentRoom?.id])

    useEffect(() => {
        if (currentRoom) {
            localStorage.setItem(
                'admin-current-room',
                JSON.stringify(currentRoom)
            )
        } else {
            localStorage.removeItem('admin-current-room')
        }
    }, [currentRoom])

    const setupRoomEventHandlers = useCallback(() => {
        racingWebSocketService.onPlayerJoined(data => {
            if (data.room) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                localStorage.setItem(
                    'admin-current-room',
                    JSON.stringify(data.room)
                )
                console.log(
                    `👤 Player ${data.participant.username} joined room`
                )
            }
        })

        racingWebSocketService.onPlayerLeft(data => {
            if (data.room) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                localStorage.setItem(
                    'admin-current-room',
                    JSON.stringify(data.room)
                )
                console.log(`👤 Player left room`)
            }
        })

        racingWebSocketService.onParticipantRemoved(data => {
            console.log(
                `👤 Participant ${data.userId} was removed: ${data.message}`
            )
        })

        racingWebSocketService.onRoomClosed(data => {
            setCurrentRoom(null)
            setParticipants([])
            setRacePackage(null)
            localStorage.removeItem('admin-current-room')
            console.log(`🚪 Room closed: ${data.message}`)
        })
    }, [])

    const createRoom = useCallback(
        async (maxParticipants = 30): Promise<void> => {
            setIsCreatingRoom(true)
            setRoomError(null)

            return new Promise((resolve, reject) => {
                console.log('🔄 Creating room from admin...')
                racingWebSocketService.createRoom(
                    {
                        adminUsername: auth.username,
                        maxParticipants,
                    },
                    response => {
                        setCurrentRoom(response.room)
                        setParticipants(response.room.participants)
                        setIsCreatingRoom(false)

                        localStorage.setItem(
                            'admin-current-room',
                            JSON.stringify(response.room)
                        )
                        console.log(
                            '🏁 Room created successfully:',
                            response.room.id
                        )
                        resolve()
                    },
                    error => {
                        setRoomError(error.message)
                        setIsCreatingRoom(false)
                        console.error('❌ Failed to create room:', error)
                        reject(new Error(error.message))
                    }
                )
            })
        },
        [auth.username, isConnected]
    )

    const configureRace = useCallback(
        async (config: RaceConfiguration): Promise<void> => {
            if (!isConnected || !currentRoom) {
                throw new Error('Not connected, or no active room')
            }

            setIsConfiguringRace(true)
            setRoomError(null)

            return new Promise((resolve, reject) => {
                racingWebSocketService.configureRace(
                    {
                        roomId: currentRoom.id,
                        adminUsername: auth.username,
                        raceConfig: config,
                    },
                    response => {
                        setCurrentRoom(response.room)
                        setIsConfiguringRace(false)
                        console.log('⚙️ Race configured successfully')
                        resolve()
                    },
                    racePackageData => {
                        setRacePackage(racePackageData)
                        console.log('📦 Race package received')
                    },
                    error => {
                        setRoomError(error.message)
                        setIsConfiguringRace(false)
                        console.error('❌ Failed to configure race:', error)
                        reject(new Error(error.message))
                    }
                )
            })
        },
        [auth.username, isConnected, currentRoom]
    )

    const startRace = useCallback(async (): Promise<void> => {
        if (!isConnected || !currentRoom) {
            throw new Error('Not connected, or no active room')
        }

        setIsStartingRace(true)
        setRoomError(null)

        return new Promise((resolve, reject) => {
            racingWebSocketService.startRace(
                {
                    roomId: currentRoom.id,
                    adminUsername: auth.username,
                },
                response => {
                    setCurrentRoom(response.room)
                    setIsStartingRace(false)
                    console.log('🏁 Race started successfully')
                    resolve()
                },
                error => {
                    setRoomError(error.message)
                    setIsStartingRace(false)
                    console.error('❌ Failed to start race:', error)
                    reject(new Error(error.message))
                }
            )
        })
    }, [auth.username, isConnected, currentRoom])

    const closeRoom = useCallback(async (): Promise<void> => {
        if (!isConnected || !currentRoom) {
            throw new Error('Not connected, or no active room')
        }

        setIsClosingRoom(true)
        setRoomError(null)

        return new Promise((resolve, reject) => {
            racingWebSocketService.closeRoom(
                {
                    roomId: currentRoom.id,
                    adminUsername: auth.username,
                },
                _response => {
                    setCurrentRoom(null)
                    setParticipants([])
                    setRacePackage(null)
                    localStorage.removeItem('admin-current-room')
                    setIsClosingRoom(false)
                    console.log('🚪 Room closed successfully')
                    resolve()
                },
                error => {
                    setRoomError(error.message)
                    setIsClosingRoom(false)
                    console.error('❌ Failed to close room:', error)
                    reject(new Error(error.message))
                }
            )
        })
    }, [auth.username, isConnected, currentRoom])

    const removeParticipant = useCallback(
        async (userId: string): Promise<void> => {
            if (!isConnected || !currentRoom) {
                throw new Error('Not connected, or no active room')
            }

            setRoomError(null)

            return new Promise((resolve, reject) => {
                racingWebSocketService.removeParticipant(
                    {
                        roomId: currentRoom.id,
                        userId,
                        adminUsername: auth.username,
                    },
                    response => {
                        setCurrentRoom(response.room)
                        setParticipants(response.room.participants)
                        console.log(
                            `👤 Participant ${userId} removed successfully`
                        )
                        resolve()
                    },
                    error => {
                        setRoomError(error.message)
                        console.error('❌ Failed to remove participant:', error)
                        reject(new Error(error.message))
                    }
                )
            })
        },
        [auth.username, isConnected, currentRoom]
    )

    const clearErrors = useCallback(() => {
        setConnectionError(null)
        setRoomError(null)
    }, [])

    const disconnect = useCallback(() => {
        racingWebSocketService.disconnect()
        setIsConnected(false)
        setCurrentRoom(null)
        setParticipants([])
        setRacePackage(null)
        localStorage.removeItem('admin-current-room')
    }, [])

    const value = {
        isConnected,
        connectionError,

        currentRoom,
        participants,
        racePackage,

        isCreatingRoom,
        isConfiguringRace,
        isStartingRace,
        isClosingRoom,

        roomError,

        createRoom,
        configureRace,
        startRace,
        closeRoom,
        removeParticipant,

        clearErrors,
        disconnect,
    }

    return (
        <AdminRoomContext.Provider value={value}>
            <Outlet />
        </AdminRoomContext.Provider>
    )
}

export const useAdminRoomContext = (): AdminRoomContextType => {
    const context = useContext(AdminRoomContext)
    if (context === undefined) {
        throw new Error(
            'useAdminRoomContext must be used within an AdminRoomProvider'
        )
    }
    return context
}
