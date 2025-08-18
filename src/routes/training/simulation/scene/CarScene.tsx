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
    const trackUpdateKey = useTrackUpdates()
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

    const [aiCars, setAiCars] = useState<any[]>([]);

    const trackId = TRACKS['current'] ? TRACKS['current'].id : 'main_circuit';
    const track = TRACKS['current'] || TRACKS['main_circuit'];

    useEffect(() => {
        const allGenomes = neatRef?.current?.population || [];
        const config: any = {
            trackId,
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
        };
        const newCars = generateAICars(config);
        setAiCars(newCars);
        forceUpdate({});
    }, [generation, trackId, trackUpdateKey, resetCounter, neatRef]);


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
