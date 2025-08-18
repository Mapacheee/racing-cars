import { Suspense, useState, useEffect } from 'react'
import type { JSX } from 'react'
import AICar from '../entities/AICar'
import { TrackScene } from '../../../../lib/racing/track'
import { TRACKS } from '../../../../lib/racing/track'
import { generateAICars } from '../systems/SpawnSystem'
import { useCanvasSettings } from '../../../../lib/contexts/useCanvasSettings'
import { useRaceReset } from '../../../../lib/contexts/RaceResetContext'
import { useNEATTraining } from '../contexts/NEATTrainingContext'
import { useTrackUpdates } from '../utils/TrackUpdateEvent'

export default function CarScene(): JSX.Element {
    const { showWaypoints, showWalls } = useCanvasSettings()
    const { resetCounter } = useRaceReset()
    const [, forceUpdate] = useState({})
    const trackUpdateKey = useTrackUpdates() // Listen for track updates
    const neatContext = useNEATTraining()

    if (!neatContext) {
        return <div>Loading NEAT context...</div>
    }

    const {
        generation,
        carStates,
        handleFitnessUpdate,
        handleCarElimination,
        neatRef,
    } = neatContext

    // regenerate cars when generation changes
    const [aiCars, setAiCars] = useState(() => {
        const initialGenomes = neatRef?.current?.population?.slice(0, 20) || [];
        return generateAICars({
            trackId: 'main_circuit',
            carCount: 20,
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
            genomes: initialGenomes,
        })
    })

    const currentTrack = 'main_circuit'
    // Get track fresh from TRACKS registry on each render to catch updates
    const track = TRACKS[currentTrack]

    // Listen for track updates (this will be triggered by track regeneration)
    useEffect(() => {
        // Track updates will cause re-render through trackUpdateKey
        // This effect runs when trackUpdateKey changes
    }, [resetCounter, trackUpdateKey])

    // update cars when generation changes
    useEffect(() => {
    const allGenomes = neatRef?.current?.population || [];
        const config: any = {
            trackId: currentTrack,
            carCount: 20,
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
        }

        const newCars = generateAICars(config)
        setAiCars(newCars)
        forceUpdate({})
    }, [generation, currentTrack, neatRef, resetCounter, trackUpdateKey])

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
            {/* render ai cars */}
            {aiCars.map(carData => {
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
