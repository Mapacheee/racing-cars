import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { racingWebSocketService } from '../services/racing-websocket'
import type { Player } from '../types/auth'
import type { RaceRoom, RoomParticipant } from '../types/racing-stream'

interface PlayerRoomContextType {
    // Connection state
    isConnected: boolean
    connectionError: string | null

    // Room state
    currentRoom: RaceRoom | null
    participants: RoomParticipant[]
    isInRoom: boolean

    // Loading states
    isJoiningRoom: boolean
    isLeavingRoom: boolean
    isInitializing: boolean

    // Error states
    roomError: string | null

    // Room management methods
    joinRoom: (roomId: string) => Promise<void>
    leaveRoom: () => Promise<void>

    // Utility methods
    clearErrors: () => void
    disconnect: () => void
}

const PlayerRoomContext = createContext<PlayerRoomContextType | undefined>(
    undefined
)

export const usePlayerRoomContext = (): PlayerRoomContextType => {
    const context = useContext(PlayerRoomContext)
    if (!context) {
        throw new Error(
            'usePlayerRoomContext must be used within a PlayerRoomProvider'
        )
    }
    return context
}

interface PlayerRoomProviderProps {}

export const PlayerRoomProvider: React.FC<PlayerRoomProviderProps> = () => {
    const { auth, isPlayer } = useAuth()
    const location = useLocation()

    const [isConnected, setIsConnected] = useState(false)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    const [currentRoom, setCurrentRoom] = useState<RaceRoom | null>(null)
    const [participants, setParticipants] = useState<RoomParticipant[]>([])
    const [isInRoom, setIsInRoom] = useState(false)

    const [isJoiningRoom, setIsJoiningRoom] = useState(false)
    const [isLeavingRoom, setIsLeavingRoom] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)

    const [roomError, setRoomError] = useState<string | null>(null)

    const playerAuth = isPlayer() && auth ? (auth as Player) : null

    useEffect(() => {
        const savedRoom = localStorage.getItem('player-current-room')
        if (savedRoom) {
            try {
                const room = JSON.parse(savedRoom) as RaceRoom
                setCurrentRoom(room)
                setParticipants(room.participants)

                const isOnRoomPage =
                    window.location.pathname === '/training/room'
                setIsInRoom(isOnRoomPage)
                console.log(
                    '🔄 Restored player room from localStorage:',
                    room.id,
                    'isOnRoomPage:',
                    isOnRoomPage
                )
            } catch (error) {
                console.error(
                    'Failed to restore room from localStorage:',
                    error
                )
                localStorage.removeItem('player-current-room')
            }
        }

        setIsInitializing(false)
    }, [])

    useEffect(() => {
        if (currentRoom && !isInitializing) {
            const isOnRoomPage = location.pathname === '/training/room'
            setIsInRoom(isOnRoomPage)
            console.log(
                '📍 Route changed:',
                location.pathname,
                'isOnRoomPage:',
                isOnRoomPage
            )
        }
    }, [location.pathname, currentRoom, isInitializing])

    useEffect(() => {
        if (!playerAuth?.token) return

        try {
            const socket = racingWebSocketService.connect(playerAuth.token)

            socket.on('connect', () => {
                setIsConnected(true)
                setConnectionError(null)
                console.log('🟢 Player connected to racing server')
            })

            socket.on('disconnect', () => {
                setIsConnected(false)
                console.log('🔴 Player disconnected from racing server')
            })

            socket.on('connect_error', error => {
                setConnectionError(`Connection failed: ${error.message}`)
                console.error('🔴 Player connection error:', error)
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
    }, [playerAuth?.token])

    useEffect(() => {
        if (
            isConnected &&
            currentRoom &&
            location.pathname === '/training/room' &&
            playerAuth?.id &&
            playerAuth?.username
        ) {
            console.log('🔄 Attempting to rejoin room:', currentRoom.id)
            racingWebSocketService.joinRoom(
                {
                    roomId: currentRoom.id,
                    userId: playerAuth.id,
                    aiGeneration: playerAuth.aiGeneration,
                    username: playerAuth.username,
                },
                response => {
                    setCurrentRoom(response.room)
                    setParticipants(response.room.participants)
                    setIsInRoom(true)
                    console.log(
                        '🏁 Successfully rejoined room:',
                        response.room.id
                    )
                },
                error => {
                    console.log('❌ Failed to rejoin room:', error)

                    racingWebSocketService.getRoomStatus(
                        currentRoom.id,
                        room => {
                            setCurrentRoom(room)
                            setParticipants(room.participants)
                            setIsInRoom(true)
                            console.log(
                                '🔄 Player room status updated:',
                                room.id
                            )
                        },
                        statusError => {
                            console.log(
                                '❌ Room no longer exists on server:',
                                statusError
                            )

                            setCurrentRoom(null)
                            setParticipants([])
                            setIsInRoom(false)
                            localStorage.removeItem('player-current-room')
                        }
                    )
                }
            )
        }
    }, [
        isConnected,
        currentRoom?.id,
        location.pathname,
        playerAuth?.id,
        playerAuth?.username,
        playerAuth?.aiGeneration,
    ])

    useEffect(() => {
        if (currentRoom) {
            localStorage.setItem(
                'player-current-room',
                JSON.stringify(currentRoom)
            )
        } else {
            localStorage.removeItem('player-current-room')
        }
    }, [currentRoom])

    const setupRoomEventHandlers = useCallback(() => {
        racingWebSocketService.onPlayerJoined(data => {
            if (data.room && isInRoom) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                console.log(
                    `👤 Player ${data.participant.username} joined room`
                )
            }
        })

        racingWebSocketService.onPlayerLeft(data => {
            if (data.room && isInRoom) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                console.log(`👤 Player left room`)
            }
        })

        racingWebSocketService.onParticipantRemoved(data => {
            if (data.userId === playerAuth?.id) {
                setCurrentRoom(null)
                setParticipants([])
                setIsInRoom(false)
                localStorage.removeItem('player-current-room')
                setRoomError(
                    'Has sido removido de la sala por el administrador'
                )
                console.log(
                    `❌ You were removed from the room: ${data.message}`
                )
            }
        })

        racingWebSocketService.onRoomClosed(data => {
            setCurrentRoom(null)
            setParticipants([])
            setIsInRoom(false)
            localStorage.removeItem('player-current-room')
            setRoomError('La sala ha sido cerrada por el administrador')
            console.log(`🚪 Room closed: ${data.message}`)
        })

        racingWebSocketService.onRaceEvent(event => {
            if (event.type === 'race_start') {
                console.log('🏁 Race started!')
                // TODO: Navigate to race view or update UI
            }
        })
    }, [playerAuth?.id, isInRoom])

    const joinRoom = useCallback(
        async (roomId: string): Promise<void> => {
            if (!playerAuth?.id || !playerAuth?.username) {
                throw new Error('User authentication required')
            }

            setIsJoiningRoom(true)
            setRoomError(null)

            return new Promise((resolve, reject) => {
                console.log(
                    `🔄 Joining room ${roomId} as ${playerAuth.username}...`
                )
                racingWebSocketService.joinRoom(
                    {
                        roomId,
                        userId: playerAuth.id,
                        aiGeneration: playerAuth.aiGeneration,
                        username: playerAuth.username,
                    },
                    response => {
                        setCurrentRoom(response.room)
                        setParticipants(response.room.participants)
                        setIsInRoom(true)
                        setIsJoiningRoom(false)
                        console.log(
                            `🏁 Successfully joined room ${roomId}:`,
                            response.room
                        )
                        resolve()
                    },
                    error => {
                        setRoomError(error.message)
                        setIsJoiningRoom(false)
                        console.error(
                            `❌ Failed to join room ${roomId}:`,
                            error
                        )
                        reject(new Error(error.message))
                    }
                )
            })
        },
        [playerAuth?.id, playerAuth?.username, playerAuth?.aiGeneration]
    )

    const leaveRoom = useCallback(async (): Promise<void> => {
        if (!currentRoom || !playerAuth?.id) {
            return
        }

        setIsLeavingRoom(true)
        setRoomError(null)

        return new Promise((resolve, reject) => {
            console.log(`🔄 Leaving room ${currentRoom.id}...`)
            racingWebSocketService.leaveRoom(
                currentRoom.id,
                playerAuth.id,
                _response => {
                    setCurrentRoom(null)
                    setParticipants([])
                    setIsInRoom(false)
                    setIsLeavingRoom(false)
                    localStorage.removeItem('player-current-room')
                    console.log('🚪 Successfully left room')
                    resolve()
                },
                error => {
                    setRoomError(error.message)
                    setIsLeavingRoom(false)
                    console.error('❌ Failed to leave room:', error)
                    reject(new Error(error.message))
                }
            )
        })
    }, [currentRoom, playerAuth?.id])

    const clearErrors = useCallback(() => {
        setRoomError(null)
        setConnectionError(null)
    }, [])

    const disconnect = useCallback(() => {
        racingWebSocketService.disconnect()
        setIsConnected(false)
        setCurrentRoom(null)
        setParticipants([])
        setIsInRoom(false)
        localStorage.removeItem('player-current-room')
    }, [])

    const value = {
        isConnected,
        connectionError,

        currentRoom,
        participants,
        isInRoom,

        isJoiningRoom,
        isLeavingRoom,
        isInitializing,

        roomError,

        joinRoom,
        leaveRoom,

        clearErrors,
        disconnect,
    }

    return (
        <PlayerRoomContext.Provider value={value}>
            <Outlet />
        </PlayerRoomContext.Provider>
    )
}
