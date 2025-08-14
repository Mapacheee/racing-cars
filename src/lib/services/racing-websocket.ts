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

/**
 * Racing WebSocket Service
 *
 * 🔐 AUTHENTICATION REQUIREMENTS:
 * - ALL WebSocket endpoints are protected with JWT authentication (WsJwtAuthGuard)
 * - Authentication token MUST be provided in the connection auth parameter: { auth: { token } }
 * - All subsequent WebSocket messages will be authenticated using this token
 * - If token is invalid/expired, connection will be rejected with authentication error
 *
 * 📋 USAGE:
 * 1. Connect with valid JWT token: racingWebSocketService.connect(token)
 * 2. All method calls will automatically use the authenticated connection
 * 3. Token should be obtained from AuthContext or login service
 *
 * ⚠️ SECURITY NOTES:
 * - Admin operations require admin-level JWT token
 * - Player operations require valid player JWT token
 * - Connection will be dropped if token becomes invalid
 */

class RacingWebSocketService {
    private socket: Socket | null = null
    private readonly baseUrl = import.meta.env['VITE_BACKEND_URL']
    private readonly namespace = '/racing-stream'

    /**
     * Connect to the racing WebSocket server
     *
     * ⚠️ AUTHENTICATION REQUIRED: All WebSocket endpoints are protected with JWT authentication.
     * The token must be provided in the auth.token parameter for all connections and messages.
     *
     * @param token - JWT authentication token (required for all WebSocket operations)
     */
    connect(token: string): Socket {
        console.log(this.baseUrl)
        if (this.socket?.connected) {
            return this.socket
        }

        this.socket = io(`${this.baseUrl}${this.namespace}`, {
            auth: { token }, // 🔑 JWT token required for authentication - all endpoints are protected
            autoConnect: true,
            transports: ['websocket', 'polling'],
        })

        this.setupErrorHandlers()
        return this.socket
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
    }

    /**
     * Get the current socket instance
     */
    getSocket(): Socket | null {
        return this.socket
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false
    }

    // Admin Room Management Methods
    /**
     * Create a new room (Admin only)
     */
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

    /**
     * Configure race settings (Admin only)
     */
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

    /**
     * Start a race (Admin only)
     */
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

    /**
     * Close a room (Admin only)
     */
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

    /**
     * Remove a participant from room (Admin only)
     */
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

    // Player Methods
    /**
     * Join a room (Player)
     */
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

    /**
     * Leave a room (Player)
     */
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

    /**
     * Get room status
     */
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

    // Event Listeners for Real-time Updates
    /**
     * Listen for new room availability
     */
    onRoomAvailable(callback: (data: RoomAvailableResponse) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('roomAvailable', callback)
    }

    /**
     * Listen for player joined events
     */
    onPlayerJoined(callback: (data: PlayerJoinedResponse) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('playerJoined', callback)
    }

    /**
     * Listen for player left events
     */
    onPlayerLeft(
        callback: (data: { userId: string; room: RaceRoom }) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('playerLeft', callback)
    }

    /**
     * Listen for race events
     */
    onRaceEvent(callback: (event: RaceEvent) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('raceEvent', callback)
    }

    /**
     * Listen for position updates
     */
    onPositionUpdate(callback: (update: PositionUpdate) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('positionUpdate', callback)
    }

    /**
     * Listen for room closed events
     */
    onRoomClosed(callback: (data: { message: string }) => void): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('roomClosed', callback)
    }

    /**
     * Listen for participant removed events
     */
    onParticipantRemoved(
        callback: (data: { userId: string; message: string }) => void
    ): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.on('participantRemoved', callback)
    }

    // Race Control Methods (Admin only)
    /**
     * Send position update (Admin only)
     */
    sendPositionUpdate(update: PositionUpdate): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.emit('positionUpdate', update)
    }

    /**
     * Send race event (Admin only)
     */
    sendRaceEvent(roomId: string, event: RaceEvent): void {
        if (!this.socket) throw new Error('Socket not connected')
        this.socket.emit('raceEvent', { roomId, event })
    }

    // Cleanup Methods
    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event?: string): void {
        if (this.socket) {
            this.socket.removeAllListeners(event)
        }
    }

    /**
     * Setup error handlers
     */
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
