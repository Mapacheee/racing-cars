import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import TrackScene from '../../../lib/racing/track/components/TrackScene'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGLTF } from '@react-three/drei'
import { Suspense } from 'react'
import { CanvasSettingsProvider, CanvasSettingsContext } from '../../../lib/contexts/CanvasSettings'
import { TRACKS, regenerateMainTrack } from '../../../lib/racing/track'
import type { Track } from '../../../lib/racing/track/types'

function TrackEditorControls({ setTrack, track }: { setTrack: (track: Track) => void, track: Track }) {
    const navigate = useNavigate();
    const settings = React.useContext(CanvasSettingsContext)
    if (!settings) return null
    return (
        <div className="absolute top-4 left-4 bg-white/90 rounded shadow-lg p-4 z-50 min-w-[250px]">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Editor de pista</h3>
            <button
                onClick={() => {
                    const seed = Math.floor(Math.random() * 1000000)
                    const newTrack = regenerateMainTrack(seed)
                    setTrack(newTrack)
                }}
                className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs mb-2"
            >
                Generar nueva pista
            </button>
            <button
                onClick={() => {
                    // code to send track to back here
                    navigate('/admin/menu')
                }}
                className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs mb-2"
            >
                Guardar y volver
            </button>
            <div className="flex flex-col gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={settings.showWaypoints} onChange={e => settings.setShowWaypoints(e.target.checked)} />
                    <span style={{ color: '#222' }}>Mostrar waypoints</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={settings.showWalls} onChange={e => settings.setShowWalls(e.target.checked)} />
                    <span style={{ color: '#222' }}>Mostrar paredes</span>
                </label>
            </div>
            <div className="mt-4 text-xs text-gray-600">
                Waypoints: {track?.waypoints?.length || 0}
            </div>
        </div>
    )
}

export default function TrackEditor(): JSX.Element {
    useEffect(() => {
        if (!sessionStorage.getItem('trackEditorReloaded')) {
            sessionStorage.setItem('trackEditorReloaded', 'true');
            window.location.reload();
        }
    }, []);

    const SpawnCar = ({ position, rotation }: { position: [number, number, number], rotation: number }) => {
        const { scene } = useGLTF('/assets/models/raceCarRed.glb')
        return (
            <primitive
                object={scene}
                position={position}
                rotation={[0, rotation, 0]}
                scale={1.5}
                userData={{ type: 'spawn-car' }}
            />
        )
    }
    const [track, setTrack] = useState<Track>(TRACKS['current'] || TRACKS['main_circuit'])
    useEffect(() => {
        document.title = 'Editor de Pista - Administración 🏎️🛠️'
    }, [])
    let carPosition: [number, number, number] | undefined = undefined;
    let carRotation: number | undefined = undefined;
    if (track?.waypoints?.length >= 2) {
        const wp1 = track.waypoints[0];
        const wp2 = track.waypoints[1];
        carPosition = [wp1.x, -0.5, wp1.z];
        const dx = wp2.x - wp1.x;
        const dz = wp2.z - wp1.z;
        carRotation = Math.atan2(dx, dz);
    }

    const canvasKey = track?.id + '-' + (track?.waypoints?.map(wp => `${wp.x},${wp.z}`).join('|') ?? '')
    return (
        <CanvasSettingsProvider>
            <CanvasSettingsContext.Consumer>
                {settings => (
                    <div className="fixed inset-0 w-screen h-screen bg-cyan-200 z-50">
                        <TrackEditorControls setTrack={setTrack} track={track} />
                        <Canvas
                            key={canvasKey}
                            camera={{ position: [0, 80, 120], fov: 30 }}
                            style={{ display: 'block', userSelect: 'none' }}
                            className="no-drag"
                        >
                            <TrackScene
                                track={track}
                                settings={{
                                    showWaypoints: settings?.showWaypoints ?? true,
                                    showWalls: settings?.showWalls ?? true,
                                    showTrack: true,
                                }}
                                enablePhysics={true}
                                enableControls={true}
                            >
                                {carPosition && carRotation !== undefined && (
                                    <Suspense fallback={null}>
                                        <SpawnCar
                                            key={carPosition.join(',') + '-' + carRotation}
                                            position={carPosition}
                                            rotation={carRotation}
                                        />
                                    </Suspense>
                                )}
                            </TrackScene>
                        </Canvas>
                    </div>
                )}
            </CanvasSettingsContext.Consumer>
        </CanvasSettingsProvider>
    )
}
