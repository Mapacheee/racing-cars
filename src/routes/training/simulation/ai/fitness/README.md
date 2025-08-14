# Track-Based Distance Measurement System

## Overview

This system implements advanced track-based distance measurement for AI car training, replacing the previous simple Euclidean distance calculation with accurate progress tracking along racing circuits.

## Key Components

### 1. TrackDistanceTracker

- Precomputes track segments and cumulative distances from waypoints
- Projects car positions onto the nearest track segment
- Handles lap wrapping and direction detection
- Maintains per-car state for efficient tracking

### 2. Enhanced CarFitnessTracker

- Uses TrackDistanceTracker for accurate distance measurement
- Tracks forward vs backward movement
- Provides better fitness scoring based on actual track progress
- Includes proper cleanup and resource management

## How It Works

### Track Precomputation

1. **Segments**: Each pair of consecutive waypoints creates a track segment
2. **Cumulative Distances**: Precomputed distances from start to each segment
3. **Total Length**: Full track length for wrap handling

### Per-Frame Tracking

1. **Segment Search**: Efficient search around last known segment (±8 segments)
2. **Point Projection**: Project car position onto nearest segment using dot product
3. **Progress Calculation**: Convert segment position to total track distance
4. **Direction Detection**: Compare car's forward vector with track direction
5. **Wrap Handling**: Detect lap completion and handle distance wraparound

### Distance Calculation

```typescript
// Project point onto segment
t = clamp((P - A) · v / |v|², 0, 1)
closestPoint = A + t * v
progress = cumulativeDistance[i] + t * segmentLength

// Handle wrap
if (delta < -totalLength/2) delta += totalLength
if (delta > totalLength/2) delta -= totalLength

// Apply direction
signedDelta = isForward ? abs(delta) : -abs(delta)
```

## Benefits

1. **Accurate Distance**: Measures actual progress along track, not straight-line distance
2. **Direction Awareness**: Distinguishes forward vs backward movement
3. **Lap Handling**: Properly handles crossing start/finish line
4. **Performance**: Efficient segment search with caching
5. **Robust Fitness**: Better AI training with accurate progress measurement

## Usage

```typescript
// Create tracker with waypoints
const tracker = new TrackDistanceTracker(track.waypoints)

// Update car position each frame
const result = tracker.updateCarPosition(carId, position, forwardDirection)

// Get tracking results
const {
    distanceDelta, // Distance moved this frame (signed)
    totalDistance, // Total distance traveled (always positive)
    isGoingForward, // Direction of movement
    distanceFromTrack, // Perpendicular distance to track
    progress, // 0-1 around the track
} = result
```

## Performance Optimizations

- **Cached Search**: Uses last known segment as starting point
- **Limited Range**: Only searches ±8 segments around cache
- **Precomputed Data**: All segment data calculated once at initialization
- **Vector Optimization**: Efficient 3D vector operations

## Configuration

Key parameters in `TrackDistanceTracker`:

- `searchRadius = 8`: How many segments to search around cache
- Direction threshold `0.4`: Minimum dot product to consider "forward"
- Wrap detection at `totalLength/2`: Threshold for lap wrap detection

This system provides the foundation for much more accurate AI training and fitness evaluation in racing scenarios.
