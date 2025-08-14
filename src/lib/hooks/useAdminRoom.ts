import { useState, useEffect, useCallback, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import { racingWebSocketService } from '../services/racing-websocket'
import type { AdminAuth } from '../types/auth'
import type {
    RaceRoom,
    RoomParticipant,
    RaceConfiguration,
    RacePackage,
    CreateRoomData,
    ConfigureRaceData,
    StartRaceData,
    CloseRoomData,
    RemoveParticipantData,
} from '../types/racing-stream'

interface UseAdminRoomReturn {
    // Connection state
    socket: Socket | null
    isConnected: boolean
    connectionError: string | null

    // Room state
    currentRoom: RaceRoom | null
    racePackage: RacePackage | null
    participants: RoomParticipant[]

    // Loading states
    isCreatingRoom: boolean
    isConfiguringRace: boolean
    isStartingRace: boolean
    isClosingRoom: boolean

    // Error states
    roomError: string | null

    // Room management methods
    createRoom: (maxParticipants: number) => Promise<void>
    configureRace: (config: RaceConfiguration) => Promise<void>
    startRace: () => Promise<void>
    closeRoom: () => Promise<void>
    removeParticipant: (userId: string) => Promise<void>

    // Utility methods
    clearErrors: () => void
    disconnect: () => void
}

export const useAdminRoom = (): UseAdminRoomReturn => {
    const { auth } = useAuth<AdminAuth>()

    // Connection state
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    // Room state
    const [currentRoom, setCurrentRoom] = useState<RaceRoom | null>(null)
    const [racePackage, setRacePackage] = useState<RacePackage | null>(null)
    const [participants, setParticipants] = useState<RoomParticipant[]>([])

    // Loading states
    const [isCreatingRoom, setIsCreatingRoom] = useState(false)
    const [isConfiguringRace, setIsConfiguringRace] = useState(false)
    const [isStartingRace, setIsStartingRace] = useState(false)
    const [isClosingRoom, setIsClosingRoom] = useState(false)

    // Error states
    const [roomError, setRoomError] = useState<string | null>(null)

    // Use refs to track if component is mounted to avoid state updates after unmount
    const isMountedRef = useRef(true)

    // Initialize WebSocket connection
    useEffect(() => {
        if (!auth?.token) return

        try {
            const socketInstance = racingWebSocketService.connect(auth.token)
            setSocket(socketInstance)

            // Connection event handlers
            socketInstance.on('connect', () => {
                if (isMountedRef.current) {
                    setIsConnected(true)
                    setConnectionError(null)
                    console.log('🟢 Admin connected to racing server')
                }
            })

            socketInstance.on('disconnect', () => {
                if (isMountedRef.current) {
                    setIsConnected(false)
                    console.log('🔴 Admin disconnected from racing server')
                }
            })

            socketInstance.on('connect_error', error => {
                if (isMountedRef.current) {
                    setConnectionError(`Connection failed: ${error.message}`)
                    console.error('🔴 Admin connection error:', error)
                }
            })

            // Room event handlers
            setupRoomEventHandlers(socketInstance)
        } catch (error) {
            console.error('Failed to connect to racing server:', error)
            if (isMountedRef.current) {
                setConnectionError('Failed to initialize WebSocket connection')
            }
        }

        return () => {
            isMountedRef.current = false
            racingWebSocketService.disconnect()
        }
    }, [auth?.token])

    // Setup room event handlers
    const setupRoomEventHandlers = useCallback((_socketInstance: Socket) => {
        // Player joined event
        racingWebSocketService.onPlayerJoined(data => {
            if (isMountedRef.current && data.room) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                console.log(
                    `👤 Player ${data.participant.username} joined room`
                )
            }
        })

        // Player left event
        racingWebSocketService.onPlayerLeft(data => {
            if (isMountedRef.current && data.room) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                console.log(`👤 Player left room`)
            }
        })

        // Participant removed event
        racingWebSocketService.onParticipantRemoved(data => {
            if (isMountedRef.current) {
                console.log(
                    `👤 Participant ${data.userId} was removed: ${data.message}`
                )
            }
        })

        // Room closed event
        racingWebSocketService.onRoomClosed(data => {
            if (isMountedRef.current) {
                setCurrentRoom(null)
                setParticipants([])
                setRacePackage(null)
                console.log(`🚪 Room closed: ${data.message}`)
            }
        })
    }, [])

    // Room management methods
    const createRoom = useCallback(
        async (maxParticipants: number): Promise<void> => {
            if (!auth?.username || !socket) {
                throw new Error('Not authenticated or connected')
            }

            setIsCreatingRoom(true)
            setRoomError(null)

            return new Promise((resolve, reject) => {
                const data: CreateRoomData = {
                    adminUsername: auth.username,
                    maxParticipants,
                }

                racingWebSocketService.createRoom(
                    data,
                    response => {
                        if (isMountedRef.current) {
                            setCurrentRoom(response.room)
                            setParticipants(response.room.participants)
                            setIsCreatingRoom(false)
                            console.log(
                                '🏁 Room created successfully:',
                                response.room.id
                            )
                            resolve()
                        }
                    },
                    error => {
                        if (isMountedRef.current) {
                            setRoomError(error.message)
                            setIsCreatingRoom(false)
                            console.error('❌ Failed to create room:', error)
                            reject(new Error(error.message))
                        }
                    }
                )
            })
        },
        [auth?.username, socket]
    )

    const configureRace = useCallback(
        async (config: RaceConfiguration): Promise<void> => {
            if (!auth?.username || !socket || !currentRoom) {
                throw new Error(
                    'Not authenticated, connected, or no active room'
                )
            }

            setIsConfiguringRace(true)
            setRoomError(null)

            return new Promise((resolve, reject) => {
                const data: ConfigureRaceData = {
                    roomId: currentRoom.id,
                    adminUsername: auth.username,
                    raceConfig: config,
                }

                racingWebSocketService.configureRace(
                    data,
                    response => {
                        if (isMountedRef.current) {
                            setCurrentRoom(response.room)
                            setIsConfiguringRace(false)
                            console.log('⚙️ Race configured successfully')
                            resolve()
                        }
                    },
                    racePackage => {
                        if (isMountedRef.current) {
                            setRacePackage(racePackage)
                            console.log('📦 Race package received')
                        }
                    },
                    error => {
                        if (isMountedRef.current) {
                            setRoomError(error.message)
                            setIsConfiguringRace(false)
                            console.error('❌ Failed to configure race:', error)
                            reject(new Error(error.message))
                        }
                    }
                )
            })
        },
        [auth?.username, socket, currentRoom]
    )

    const startRace = useCallback(async (): Promise<void> => {
        if (!auth?.username || !socket || !currentRoom) {
            throw new Error('Not authenticated, connected, or no active room')
        }

        setIsStartingRace(true)
        setRoomError(null)

        return new Promise((resolve, reject) => {
            const data: StartRaceData = {
                roomId: currentRoom.id,
                adminUsername: auth.username,
            }

            racingWebSocketService.startRace(
                data,
                response => {
                    if (isMountedRef.current) {
                        setCurrentRoom(response.room)
                        setIsStartingRace(false)
                        console.log('🏁 Race started successfully')
                        resolve()
                    }
                },
                error => {
                    if (isMountedRef.current) {
                        setRoomError(error.message)
                        setIsStartingRace(false)
                        console.error('❌ Failed to start race:', error)
                        reject(new Error(error.message))
                    }
                }
            )
        })
    }, [auth?.username, socket, currentRoom])

    const closeRoom = useCallback(async (): Promise<void> => {
        if (!auth?.username || !socket || !currentRoom) {
            throw new Error('Not authenticated, connected, or no active room')
        }

        setIsClosingRoom(true)
        setRoomError(null)

        return new Promise((resolve, reject) => {
            const data: CloseRoomData = {
                roomId: currentRoom.id,
                adminUsername: auth.username,
            }

            racingWebSocketService.closeRoom(
                data,
                _response => {
                    if (isMountedRef.current) {
                        setCurrentRoom(null)
                        setParticipants([])
                        setRacePackage(null)
                        setIsClosingRoom(false)
                        console.log('🚪 Room closed successfully')
                        resolve()
                    }
                },
                error => {
                    if (isMountedRef.current) {
                        setRoomError(error.message)
                        setIsClosingRoom(false)
                        console.error('❌ Failed to close room:', error)
                        reject(new Error(error.message))
                    }
                }
            )
        })
    }, [auth?.username, socket, currentRoom])

    const removeParticipant = useCallback(
        async (userId: string): Promise<void> => {
            if (!auth?.username || !socket || !currentRoom) {
                throw new Error(
                    'Not authenticated, connected, or no active room'
                )
            }

            setRoomError(null)

            return new Promise((resolve, reject) => {
                const data: RemoveParticipantData = {
                    roomId: currentRoom.id,
                    userId,
                    adminUsername: auth.username,
                }

                racingWebSocketService.removeParticipant(
                    data,
                    response => {
                        if (isMountedRef.current) {
                            setCurrentRoom(response.room)
                            setParticipants(response.room.participants)
                            console.log(
                                `👤 Participant ${userId} removed successfully`
                            )
                            resolve()
                        }
                    },
                    error => {
                        if (isMountedRef.current) {
                            setRoomError(error.message)
                            console.error(
                                '❌ Failed to remove participant:',
                                error
                            )
                            reject(new Error(error.message))
                        }
                    }
                )
            })
        },
        [auth?.username, socket, currentRoom]
    )

    // Utility methods
    const clearErrors = useCallback(() => {
        setConnectionError(null)
        setRoomError(null)
    }, [])

    const disconnect = useCallback(() => {
        racingWebSocketService.disconnect()
        setSocket(null)
        setIsConnected(false)
        setCurrentRoom(null)
        setParticipants([])
        setRacePackage(null)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    return {
        // Connection state
        socket,
        isConnected,
        connectionError,

        // Room state
        currentRoom,
        racePackage,
        participants,

        // Loading states
        isCreatingRoom,
        isConfiguringRace,
        isStartingRace,
        isClosingRoom,

        // Error states
        roomError,

        // Room management methods
        createRoom,
        configureRace,
        startRace,
        closeRoom,
        removeParticipant,

        // Utility methods
        clearErrors,
        disconnect,
    }
}
