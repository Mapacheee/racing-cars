import { Suspense, useState, useEffect } from 'react'
import type { Track } from '../../../../lib/racing/track/types'
import type { JSX } from 'react'
import AICar from '../entities/AICar'
import { BaseScene } from '../../../../lib/components/shared'
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

    const {
        generation,
        carStates,
        handleFitnessUpdate,
        handleCarElimination,
        neatRef,
        isLoading,
    } = neatContext || {}

    console.log('🔍 CarScene neatRef reference debug:', {
        hasNeatContext: !!neatContext,
        hasNeatRef: !!neatRef,
        neatRefReference: neatRef,
        neatRefCurrent: neatRef?.current,
        isLoadingValue: isLoading,
    })

    const trackId = track?.id || 'main_circuit'

    const isNeatReady = !!(neatContext && !isLoading && neatRef?.current)

    useEffect(() => {
        console.log('!!!!! isNeatReady(CarScene): ', isNeatReady)
        console.log('!!!! CarScene: ', {
            isNeatReady,
            neatContext: !!neatContext,
            isLoading,
            neatRefCurrent: neatRef?.current,
            hasNeatRef: !!neatRef,
            neatRefCurrentType: typeof neatRef?.current,
            neatRefCurrentPopulation: neatRef?.current?.population?.length,
        })

        if (!neatContext) {
            console.log('❌ CarScene: neatContext is null/undefined')
            return
        }
        if (isLoading) {
            console.log('⏳ CarScene: NEAT is still loading')
            return
        }
        if (!neatRef) {
            console.log('❌ CarScene: neatRef is null/undefined')
            return
        }
        if (!neatRef.current) {
            console.log(
                '❌ CarScene: neatRef.current is null/undefined - NEAT instance not created yet'
            )
            return
        }
        if (!neatRef.current.population) {
            console.log(
                '❌ CarScene: neatRef.current.population is null/undefined'
            )
            return
        }

        if (!track || !track.waypoints || track.waypoints.length < 2) {
            console.log('❌ CarScene: track or waypoints not ready')
            return
        }

        console.log('✅ CarScene: All conditions met, generating cars...')

        const firstWaypoint = track.waypoints[0]
        const secondWaypoint = track.waypoints[1]

        const dx = secondWaypoint.x - firstWaypoint.x
        const dz = secondWaypoint.z - firstWaypoint.z
        const rotation = Math.atan2(dx, dz)

        const allGenomes = neatRef.current.population || []
        const config: any = {
            trackId,
            carCount: Math.min(20, allGenomes.length),
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
        <BaseScene
            track={track}
            settings={{
                showWaypoints,
                showWalls,
                showTrack: true,
            }}
            enablePhysics={true}
            enableControls={true}
        >
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
        </BaseScene>
    )
}
