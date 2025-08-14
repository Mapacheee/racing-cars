# Componentes del racing

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Módulos](#módulos)
  - [Track System](#track-system)
  - [Car System](#car-system)
- [Uso](#uso)
- [Configuración](#configuración)
- [API Reference](#api-reference)

## Descripción General

Componentes de simulación de pistas y autos, contiene:
- Generación de pistas a través de waypoints (puntos).
- Autos con fisicas (Rapier.js)
- Sistema de sensores para ia
- Visualización pa debug
- Aprendizaje con algoritmo neat

## Arquitectura

```
/lib/racing/
├── track/                 # Sistema de pistas
│   ├── components/        # Componentes React
│   ├── systems/          # Lógica de waypoints
│   ├── types/            # Definiciones TypeScript
│   └── config/           # Configuración de pistas
│
├── cars/                 # Sistema de autos
│   ├── components/       # Componentes React
│   ├── systems/          # Sistemas de sensores/spawn
│   ├── types/            # Definiciones TypeScript
│   └── config/           # Configuración física
│
└── README.md            # Esta cosa
```

## Módulos

### Track System

Proporciona componentes para renderizar y gestionar pistas de carreras.

#### Componentes Principales

- **`TrackScene`**: Componente principal que renderiza la pista completa
- **`TrackWalls`**: Renderiza las paredes/bordes de la pista
- **`TrackFloor`**: Superficie de la pista
- **`WaypointSystem`**: Gestión de puntos de control

#### Ejemplo de Uso

```tsx
import { TrackScene } from '../lib/racing/track'
import { TRACKS } from '../lib/racing/track'

function RaceScene() {
  const track = TRACKS.main_circuit
  
  return (
    <TrackScene 
      track={track}
      showWaypoints={true}
      onWaypointAdd={(position) => console.log('Waypoint added:', position)}
    />
  )
}
```

#### Configuración de Pistas

```typescript
// config/tracks.ts
export const TRACKS = {
  main_circuit: {
    id: 'main_circuit',
    name: 'Circuito Principal',
    walls: [/* coordenadas de paredes */],
    waypoints: [/* puntos de control */],
    spawnPoints: [/* posiciones de inicio */]
  }
}
```

### Car System

Componentes para autos con fisica, sensores e ia.

#### Componentes Principales

- **`BaseCar3D`**: Componente base reutilizable para cualquier tipo de auto
- **`SensorVisualization`**: Visualización de sensores para debugging
- **`SpawnSystem`**: Sistema de generación de autos

#### Ejemplo de Uso

```tsx
import { BaseCar3D, CAR_MODELS } from '../lib/racing/cars'

function MyCar() {
  const carRef = useRef<Car3DRef>(null)
  
  return (
    <BaseCar3D
      ref={carRef}
      car={carData}
      modelPath={CAR_MODELS.default}
      physics={{
        mass: 1.5,
        friction: 3.0,
        restitution: 0
      }}
      onCollision={(event) => console.log('¡Colisión!')}
    >
      {/* Componentes adicionales (sensores, efectos, etc.) */}
    </BaseCar3D>
  )
}
```

#### Sistema de Sensores

```typescript
import { createSensorReadings, DEFAULT_SENSOR_CONFIG } from '../lib/racing/cars'

// Crear lecturas de sensores
const readings = createSensorReadings(
  carPosition,    // Vector3
  carHeading,     // number (radianes)
  track.walls,    // Paredes de la pista
  DEFAULT_SENSOR_CONFIG
)

// Resultado: { left: 0.8, leftCenter: 0.9, center: 1.0, rightCenter: 0.7, right: 0.5 }
```

## Uso

### 1. Importar Componentes

```tsx
// Importar sistema de pistas
import { TrackScene, TRACKS } from '../lib/racing/track'

// Importar sistema de autos
import { 
  BaseCar3D, 
  SensorVisualization,
  CAR_MODELS,
  type Car3DRef 
} from '../lib/racing/cars'
```

### 2. Crear una Escena de Carrera

```tsx
function RaceSimulation() {
  const track = TRACKS.main_circuit
  
  return (
    <Canvas>
      <Physics>
        {/* Renderizar pista */}
        <TrackScene track={track} />
        
        {/* Renderizar autos */}
        <BaseCar3D 
          car={carData}
          modelPath={CAR_MODELS.default}
          physics={{ mass: 1.5, friction: 3.0 }}
        />
      </Physics>
    </Canvas>
  )
}
```

### 3. Integrar con IA (NEAT)

```tsx
function AICar({ carData, genome }) {
  const carRef = useRef<Car3DRef>(null)
  const [sensorReadings, setSensorReadings] = useState()
  
  useEffect(() => {
    // Loop de simulación
    function update() {
      const car = carRef.current
      if (car?.rigidBody) {
        // Obtener posición del auto
        const position = car.rigidBody.translation()
        
        // Actualizar sensores
        const readings = createSensorReadings(position, heading, track.walls)
        setSensorReadings(readings)
        
        // Aplicar acciones de IA
        const actions = neatController.getControlActions(readings)
        controller.applyActions(actions, car.rigidBody)
      }
    }
    
    const frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [])
  
  return (
    <BaseCar3D ref={carRef} car={carData}>
      <SensorVisualization 
        carPosition={position}
        carRotation={heading}
        sensorReadings={sensorReadings}
        visible={showDebug}
      />
    </BaseCar3D>
  )
}
```

## Configuración

### Configuración de Física

```typescript
// cars/config/physics.ts
export const DEFAULT_CAR_PHYSICS = {
  mass: 1.5,
  friction: 3.0,
  restitution: 0,
  angularDamping: 3.0,
  linearDamping: 0.12
}
```

### Configuración de Sensores

```typescript
// cars/config/sensors.ts
export const DEFAULT_SENSOR_CONFIG = {
  maxDistance: 10,
  angles: {
    left: -60,
    leftCenter: -30, 
    center: 0,
    rightCenter: 30,
    right: 60
  }
}
```

### Modelos de Autos

```typescript
// cars/config/models.ts
export const CAR_MODELS = {
  default: '/assets/models/raceCarBlue.glb',
  eliminated: '/assets/models/raceCarOrange.glb',
  winner: '/assets/models/raceCarGreen.glb'
}
```

## 📚 API Reference

### BaseCar3D Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `car` | `BaseCar` | Datos del auto (posición, rotación, etc.) |
| `physics` | `Partial<CarPhysicsConfig>` | Configuración física opcional |
| `modelPath` | `string` | Ruta al modelo 3D del auto |
| `visible` | `boolean` | Visibilidad del auto |
| `onCollision` | `(event) => void` | Callback de colisión |
| `children` | `ReactNode` | Componentes hijos (sensores, efectos) |

### Car3DRef Methods

| Método | Descripción |
|--------|-------------|
| `getPosition()` | Obtiene posición `[x, y, z]` |
| `getRotation()` | Obtiene rotación `[x, y, z]` |
| `getVelocity()` | Obtiene velocidad `[x, y, z]` |
| `applyForce(force)` | Aplica fuerza al auto |
| `applyTorque(torque)` | Aplica torque al auto |
| `resetPosition(pos, rot?)` | Resetea posición y rotación |

### TrackScene Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `track` | `Track` | Configuración de la pista |
| `showWaypoints` | `boolean` | Mostrar waypoints visualmente |
| `onWaypointAdd` | `(pos) => void` | Callback al agregar waypoint |
| `onWaypointMove` | `(id, pos) => void` | Callback al mover waypoint |

## Casos de Uso

### 1. Entrenamiento de IA
- Usar `BaseCar3D` con sensores
- Integrar con algoritmos NEAT/genetic algorithms
- Visualizar progreso con `SensorVisualization`

### 2. Carreras Multijugador
- Múltiples instancias de `BaseCar3D`
- Diferentes modelos/colores por jugador
- Sistema de colisiones configurado

### 3. Editor de Pistas
- `TrackScene` en modo edición
- Callbacks de waypoint para edición
- Previsualización en tiempo real

## Extensibilidad

El sistema está diseñado para ser extensible:

### Agregar Nuevos Tipos de Auto
```typescript
// Extender BaseCar3D para autos especiales
function SportsCar(props) {
  return (
    <BaseCar3D 
      {...props}
      physics={{ mass: 1.2, friction: 4.0 }} // Más liviano, más agarre
      modelPath="/models/sportscar.glb"
    />
  )
}
```

### Agregar Nuevos Sensores
```typescript
// Extender el sistema de sensores
export function createAdvancedSensors(position, heading, environment) {
  const basicSensors = createSensorReadings(position, heading, environment.walls)
  
  return {
    ...basicSensors,
    speedSensor: getCurrentSpeed(),
    proximityToGoal: getDistanceToGoal(position)
  }
}
```