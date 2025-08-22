export type RoomStatus = 'waiting' | 'configured' | 'racing' | 'finished'

export interface RoomParticipant {
    userId: string
    username: string
    aiGeneration: number
    socketId: string
    aiGeneration: number
}

export interface RaceRoom {
    id: string
    adminId: string
    maxParticipants: number
    participants: RoomParticipant[]
    status: RoomStatus
    raceConfig?: RaceConfiguration
    createdAt: Date
}

export interface RaceConfiguration {
    trackId: string
    maxParticipants: number
    raceDuration: number
    weather: Weather
    difficulty: Difficulty
}

export interface RacePackage {
    track: Track
    participants: RoomParticipant[]
    config: RaceConfiguration
    aiModels: AIModel[]
}

export interface PositionUpdate {
    roomId: string
    participantId: string
    position: { x: number; y: number; z: number }
    lap: number
    timestamp: number
}

export interface RaceEvent {
    type:
        | 'race_start'
        | 'lap_completed'
        | 'race_finish'
        | 'collision'
        | 'position_change'
    participantId?: string
    data: any
    timestamp: number
}

export interface CreateRoomData {
    adminUsername: string
    maxParticipants: number
}

export interface JoinRoomData {
    roomId: string
    userId: string
    aiGeneration: number
    username: string
}

export interface ConfigureRaceData {
    roomId: string
    adminUsername: string
    raceConfig: RaceConfiguration
}

export interface StartRaceData {
    roomId: string
    adminUsername: string
}

export interface CloseRoomData {
    roomId: string
    adminUsername: string
}

export interface RemoveParticipantData {
    roomId: string
    userId: string
    adminUsername: string
}

export interface RoomCreatedResponse {
    room: RaceRoom
    message: string
}

export interface RoomJoinedResponse {
    room: RaceRoom
}

export interface ErrorResponse {
    message: string
    error?: string
}

export interface RoomAvailableResponse {
    roomId: string
    maxParticipants: number
}

export interface PlayerJoinedResponse {
    participant: RoomParticipant
    room: RaceRoom
}

export interface RaceConfiguredResponse {
    room: RaceRoom
    config: RaceConfiguration
}

export interface RaceStartedResponse {
    room: RaceRoom
    timestamp: number
}
