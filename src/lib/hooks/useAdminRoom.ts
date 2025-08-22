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
    socket: Socket | null
    isConnected: boolean
    connectionError: string | null

    currentRoom: RaceRoom | null
    racePackage: RacePackage | null
    participants: RoomParticipant[]

    isCreatingRoom: boolean
    isConfiguringRace: boolean
    isStartingRace: boolean
    isClosingRoom: boolean

    roomError: string | null

    createRoom: (maxParticipants: number) => Promise<void>
    configureRace: (config: RaceConfiguration) => Promise<void>
    startRace: () => Promise<void>
    closeRoom: () => Promise<void>
    removeParticipant: (userId: string) => Promise<void>

    clearErrors: () => void
    disconnect: () => void
}

export const useAdminRoom = (): UseAdminRoomReturn => {
    const { auth } = useAuth<AdminAuth>()

    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    const [currentRoom, setCurrentRoom] = useState<RaceRoom | null>(null)
    const [racePackage, setRacePackage] = useState<RacePackage | null>(null)
    const [participants, setParticipants] = useState<RoomParticipant[]>([])

    const [isCreatingRoom, setIsCreatingRoom] = useState(false)
    const [isConfiguringRace, setIsConfiguringRace] = useState(false)
    const [isStartingRace, setIsStartingRace] = useState(false)
    const [isClosingRoom, setIsClosingRoom] = useState(false)

    const [roomError, setRoomError] = useState<string | null>(null)

    const isMountedRef = useRef(true)

    useEffect(() => {
        if (!auth?.token) return

        try {
            const socketInstance = racingWebSocketService.connect(auth.token)
            setSocket(socketInstance)

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

    const setupRoomEventHandlers = useCallback((_socketInstance: Socket) => {
        racingWebSocketService.onPlayerJoined(data => {
            if (isMountedRef.current && data.room) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                console.log(
                    `👤 Player ${data.participant.username} joined room`
                )
            }
        })

        racingWebSocketService.onPlayerLeft(data => {
            if (isMountedRef.current && data.room) {
                setCurrentRoom(data.room)
                setParticipants(data.room.participants)
                console.log(`👤 Player left room`)
            }
        })

        racingWebSocketService.onParticipantRemoved(data => {
            if (isMountedRef.current) {
                console.log(
                    `👤 Participant ${data.userId} was removed: ${data.message}`
                )
            }
        })

        racingWebSocketService.onRoomClosed(data => {
            if (isMountedRef.current) {
                setCurrentRoom(null)
                setParticipants([])
                setRacePackage(null)
                console.log(`🚪 Room closed: ${data.message}`)
            }
        })
    }, [])

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

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    return {
        socket,
        isConnected,
        connectionError,

        currentRoom,
        racePackage,
        participants,

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
}
