# Racing WebSocket Service Documentation

## Authentication Requirements

**ALL WebSocket endpoints are protected with JWT authentication.** Every connection and message requires a valid JWT token.

### Connection Authentication

```typescript
import { racingWebSocketService } from './racing-websocket'

// ✅ CORRECT: Connect with JWT token
const token = 'your-jwt-token-here'
racingWebSocketService.connect(token)

// ❌ INCORRECT: Will fail without token
racingWebSocketService.connect() // This won't work
```

### Token Format

The JWT token must be provided in the connection auth parameter:

```typescript
// Backend expects this format:
{
    auth: {
        token: 'your-jwt-token-here'
    }
}
```

### Token Sources

Get your JWT token from:

- **Admin**: Admin login service
- **Player**: Player login service
- **React Context**: `useAuth()` hook from AuthContext

```typescript
// Example with AuthContext
import { useAuth } from '../contexts/AuthContext'

function useRacingWebSocket() {
    const { token } = useAuth()

    useEffect(() => {
        if (token) {
            racingWebSocketService.connect(token)
        }

        return () => {
            racingWebSocketService.disconnect()
        }
    }, [token])
}
```

## Permission Levels

### Admin Operations (Require Admin JWT)

- `createRoom()` - Create new racing rooms
- `configureRace()` - Set up race parameters
- `startRace()` - Begin races
- `closeRoom()` - Close racing rooms
- `removeParticipant()` - Remove players from room
- `sendPositionUpdate()` - Send race position data
- `sendRaceEvent()` - Send race events

### Player Operations (Require Player JWT)

- `joinRoom()` - Join existing rooms
- `leaveRoom()` - Leave current room
- `getRoomStatus()` - Get room information

### Public Operations (Any Valid JWT)

- Event listeners (onRoomAvailable, onPlayerJoined, etc.)

## Error Handling

### Authentication Errors

```typescript
// Connection errors
socket.on('connect_error', error => {
    if (error.message.includes('Authentication')) {
        // Handle invalid/expired token
        // Redirect to login or refresh token
    }
})

// WebSocket errors
socket.on('error', error => {
    if (error.message.includes('Unauthorized')) {
        // Handle permission denied
        // User doesn't have required permissions
    }
})
```

### Token Expiration

When JWT token expires:

1. WebSocket connection will be terminated
2. Reconnection attempts will fail
3. User needs to obtain new token and reconnect

```typescript
// Handle token refresh
function handleTokenRefresh(newToken: string) {
    racingWebSocketService.disconnect()
    racingWebSocketService.connect(newToken)
}
```

## Usage Examples

### Admin Room Creation

```typescript
import { racingWebSocketService } from './racing-websocket'

// 1. Connect with admin token
const adminToken = await adminLoginService.getToken()
racingWebSocketService.connect(adminToken)

// 2. Create room
racingWebSocketService.createRoom(
    {
        adminUsername: 'admin',
        maxParticipants: 8,
    },
    response => {
        console.log('Room created:', response.room)
    },
    error => {
        console.error('Failed to create room:', error)
    }
)
```

### Player Joining Room

```typescript
// 1. Connect with player token
const playerToken = await playerLoginService.getToken()
racingWebSocketService.connect(playerToken)

// 2. Join room
racingWebSocketService.joinRoom(
    {
        roomId: 'room-123',
        userId: 'player-456',
        username: 'PlayerOne',
    },
    response => {
        console.log('Joined room:', response.room)
    },
    error => {
        console.error('Failed to join room:', error)
    }
)
```

## Security Notes

1. **Never expose JWT tokens** in console logs or client-side storage
2. **Always validate token expiration** before making requests
3. **Handle authentication failures** gracefully with user feedback
4. **Use HTTPS** in production to protect token transmission
5. **Implement token refresh** mechanisms for long-running connections

## Backend Guard Implementation

The backend uses `WsJwtAuthGuard` which:

- Validates JWT tokens from `socket.handshake.auth.token`
- Extracts user information and attaches to socket
- Rejects connections with invalid/missing tokens
- Supports multiple token sources (auth object, headers, query params)

```typescript
// Backend guard extracts token from:
1. socket.handshake.auth.token (preferred)
2. socket.handshake.headers.authorization (Bearer token)
3. socket.handshake.query.token (fallback)
```
