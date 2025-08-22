export interface Waypoint {
    x: number
    z: number
    radius: number
}

export interface TrackPiece {
    model: string
    position: [number, number, number]
    rotation: [number, number, number]
}

export interface Wall {
    start: { x: number; z: number }
    end: { x: number; z: number }
    side: 'left' | 'right'
}

export interface Track {
    id: string
    name: string
    waypoints: Waypoint[]
    pieces: TrackPiece[]
    walls: Wall[]
    length: number

    splineData?: {
        controlPoints: { x: number; y: number }[]
        centralPath: { x: number; y: number }[]
        trackWidth: number
    }
    seed?: number
}

export interface TrackGeometry {
    width: number
    height: number
    length: number
}

export interface TrackEditMode {
    enabled: boolean
    mode: 'add' | 'move' | 'remove' | 'swap'
    selectedWaypoint?: number
}

export interface TrackViewSettings {
    showWaypoints: boolean
    showWalls: boolean
    showTrack: boolean
}

export interface CarTrackingState {
    currentT: number
    distanceTraveled: number
    totalDistance: number
    isGoingReverse: boolean
    distanceFromTrack: number
    progress: number
}
