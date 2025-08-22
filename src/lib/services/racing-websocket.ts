import { io, Socket } from 'socket.io-client'
import type {
    CreateRoomData,
    JoinRoomData,
    ConfigureRaceData,
    StartRaceData,
    CloseRoomData,
    RemoveParticipantData,
    RoomCreatedResponse,
    RoomJoinedResponse,
    ErrorResponse,
    RoomAvailableResponse,
    PlayerJoinedResponse,
    RaceConfiguredResponse,
    RaceStartedResponse,
    RaceRoom,
    RacePackage,
    PositionUpdate,
    RaceEvent,
} from '../types/racing-stream'

class RacingWebSocketService {
    private socket: Socket | null = null
    private readonly baseUrl = import.meta.env['VITE_BACKEND_URL']
    private readonly namespace = '/racing-stream'

    connect(token: string): Socket {
        if (this.socket?.connected) {
            return this.socket
        }

        this.socket = io(`${this.baseUrl}${this.namespace}`, {
            auth: { token },
            autoConnect: true,
            transports: ['websocket', 'polling'],
        })

        this.setupErrorHandlers()
        return this.socket
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
    }

    getSocket(): Socket | null {
        return this.socket
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false
    }

    createRoom(
        data: CreateRoomData,
        onSuccess: (response: RoomCreatedResponse) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('createRoom', data)
        this.socket.once('roomCreated', onSuccess)
        this.socket.once('error', onError)
    }

    configureRace(
        data: ConfigureRaceData,
        onSuccess: (response: RaceConfiguredResponse) => void,
        onRacePackage: (racePackage: RacePackage) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('configureRace', data)
        this.socket.once('raceConfigured', onSuccess)
        this.socket.once('racePackage', onRacePackage)
        this.socket.once('error', onError)
    }

    startRace(
        data: StartRaceData,
        onSuccess: (response: RaceStartedResponse) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('startRace', data)
        this.socket.once('raceStarted', onSuccess)
        this.socket.once('error', onError)
    }

    closeRoom(
        data: CloseRoomData,
        onSuccess: (response: { roomId: string; message: string }) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('closeRoom', data)
        this.socket.once('roomClosedSuccess', onSuccess)
        this.socket.once('error', onError)
    }

    removeParticipant(
        data: RemoveParticipantData,
        onSuccess: (response: {
            roomId: string
            userId: string
            room: RaceRoom
        }) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('removeParticipant', data)
        this.socket.once('participantRemovedSuccess', onSuccess)
        this.socket.once('error', onError)
    }

    joinRoom(
        data: JoinRoomData,
        onSuccess: (response: RoomJoinedResponse) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('joinRoom', data)
        this.socket.once('roomJoined', onSuccess)
        this.socket.once('error', onError)
    }

    leaveRoom(
        roomId: string,
        userId: string,
        onSuccess: (response: { message: string }) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('leaveRoom', { roomId, userId })
        this.socket.once('roomLeft', onSuccess)
        this.socket.once('error', onError)
    }

    getRoomStatus(
        roomId: string,
        onSuccess: (room: RaceRoom) => void,
        onError: (error: ErrorResponse) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')

        this.socket.emit('getRoomStatus', { roomId })
        this.socket.once('roomStatus', onSuccess)
        this.socket.once('error', onError)
    }

    onRoomAvailable(callback: (data: RoomAvailableResponse) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('roomAvailable', callback)
    }

    onPlayerJoined(callback: (data: PlayerJoinedResponse) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('playerJoined', callback)
    }

    onPlayerLeft(
        callback: (data: { userId: string; room: RaceRoom }) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('playerLeft', callback)
    }

    onRaceEvent(callback: (event: RaceEvent) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('raceEvent', callback)
    }

    onPositionUpdate(callback: (update: PositionUpdate) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('positionUpdate', callback)
    }

    onRoomClosed(callback: (data: { message: string }) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('roomClosed', callback)
    }

    onParticipantRemoved(
        callback: (data: { userId: string; message: string }) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('participantRemoved', callback)
    }

    sendPositionUpdate(update: PositionUpdate): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.emit('positionUpdate', update)
    }

    sendRaceEvent(roomId: string, event: RaceEvent): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.emit('raceEvent', { roomId, event })
    }

    removeAllListeners(event?: string): void {
        if (this.socket) {
            this.socket.removeAllListeners(event)
        }
    }

    private setupErrorHandlers(): void {
        if (!this.socket) return

        this.socket.on('connect', () => {
            console.log('✅ Connected to racing WebSocket server')
        })

        this.socket.on('disconnect', reason => {
            console.log('❌ Disconnected from racing WebSocket server:', reason)
        })

        this.socket.on('connect_error', error => {
            console.error('🔴 WebSocket connection error:', error)
        })

        this.socket.on('error', error => {
            console.error('🔴 WebSocket error:', error)
        })
    }
}

// Export singleton instance
export const racingWebSocketService = new RacingWebSocketService()
export default racingWebSocketService
