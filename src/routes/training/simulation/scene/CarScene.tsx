import { Suspense, useState, useEffect } from 'react'
import type { Track } from '../../../../lib/racing/track/types'
import type { JSX } from 'react'
import AICar from '../entities/AICar'
import { TrackScene } from '../../../../lib/racing/track'
import { generateAICars } from '../systems/SpawnSystem'
import { useCanvasSettings } from '../../../../lib/contexts/useCanvasSettings'
import { useRaceReset } from '../../../../lib/contexts/RaceResetContext'
import { useNEATTraining } from '../contexts/NEATTrainingContext'
import { useTrackUpdates } from '../utils/TrackUpdateEvent'

export default function CarScene({ track }: { track: Track }): JSX.Element {
    const { showWaypoints, showWalls } = useCanvasSettings()
    const { resetCounter } = useRaceReset()
    const [, forceUpdate] = useState({})
    const trackUpdateKey = useTrackUpdates()
    const neatContext = useNEATTraining()
    const [aiCars, setAiCars] = useState<any[]>([])

    // Extract context data with safe defaults
    const {
        generation,
        carStates,
        handleFitnessUpdate,
        handleCarElimination,
        neatRef,
        isLoading,
    } = neatContext || {}

    const trackId = track?.id || 'main_circuit'

    // Check if NEAT is ready to generate cars
    const isNeatReady = neatContext && !isLoading && neatRef?.current

    useEffect(() => {
        if (!track || !track.waypoints || track.waypoints.length < 2) return
        if (!isNeatReady || !neatRef?.current?.population) {
            console.log(
                'NEAT population not ready yet, skipping car generation'
            )
            return
        }

        // Get the first and second waypoint
        const firstWaypoint = track.waypoints[0]
        const secondWaypoint = track.waypoints[1]

        // Calculate position and rotation
        const dx = secondWaypoint.x - firstWaypoint.x
        const dz = secondWaypoint.z - firstWaypoint.z
        const rotation = Math.atan2(dx, dz)

        // Generate cars using NEAT population
        const allGenomes = neatRef.current.population || []
        const config: any = {
            trackId,
            carCount: Math.min(20, allGenomes.length), // Use actual population size
            colors: [
                'red',
                'blue',
                'green',
                'yellow',
                'purple',
                'orange',
                'pink',
                'cyan',
                'magenta',
                'lime',
                'indigo',
                'maroon',
                'navy',
                'olive',
                'teal',
                'silver',
                'gold',
                'coral',
                'salmon',
                'khaki',
            ],
            useNEAT: true,
            generation: generation,
            genomes: allGenomes,
            spawnOverride: {
                position: [firstWaypoint.x, -0.5, firstWaypoint.z],
                rotation,
            },
        }

        let newCars = generateAICars(config)
        if (config.spawnOverride) {
            newCars = newCars.map((car: any) => ({
                ...car,
                position: config.spawnOverride.position,
                rotation: config.spawnOverride.rotation,
            }))
        }

        console.log(
            `Generated ${newCars.length} AI cars for generation ${generation}`
        )
        setAiCars(newCars)
        forceUpdate({})
    }, [
        generation,
        trackId,
        trackUpdateKey,
        resetCounter,
        neatRef,
        track,
        isLoading,
        isNeatReady,
    ])

    return (
        <TrackScene
            track={track}
            settings={{
                showWaypoints,
                showWalls,
                showTrack: true,
            }}
            enablePhysics={true}
            enableControls={true}
        >
            {/* render ai cars only when NEAT is ready */}
            {isNeatReady &&
                carStates &&
                handleFitnessUpdate &&
                handleCarElimination &&
                aiCars.map(carData => {
                    const carState = carStates.get(carData.id)
                    const isCarEliminated = carState?.isEliminated || false

                    return (
                        <Suspense key={carData.id} fallback={null}>
                            <AICar
                                carData={carData}
                                onFitnessUpdate={handleFitnessUpdate}
                                onCarElimination={handleCarElimination}
                                isEliminated={isCarEliminated}
                            />
                        </Suspense>
                    )
                })}
        </TrackScene>
    )
}
