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

    const trackId = track?.id || 'main_circuit';

    useEffect(() => {
        if (!track || !track.waypoints || track.waypoints.length < 2) return;
        // Obtén el primer y segundo waypoint
        const firstWaypoint = track.waypoints[0];
        const secondWaypoint = track.waypoints[1];
        // Calcula posición y rotación
        const dx = secondWaypoint.x - firstWaypoint.x;
        const dz = secondWaypoint.z - firstWaypoint.z;
        const rotation = Math.atan2(dx, dz);
        // Genera autos usando estos datos
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
            spawnOverride: {
                position: [firstWaypoint.x, -0.5, firstWaypoint.z],
                rotation,
            },
        };
        let newCars = generateAICars(config);
        if (config.spawnOverride) {
            newCars = newCars.map((car: any) => ({
                ...car,
                position: config.spawnOverride.position,
                rotation: config.spawnOverride.rotation,
            }));
        }
        setAiCars(newCars);
        forceUpdate({});
    }, [generation, trackId, trackUpdateKey, resetCounter, neatRef, track]);


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
