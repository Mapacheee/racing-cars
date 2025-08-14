import { useEffect, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCanvasSettings } from '../../contexts/useCanvasSettings'
import { TRACKS } from '../../racing/track'

export default function TrackEditorControlPanel(): JSX.Element {
    const { showWaypoints, setShowWaypoints, showWalls, setShowWalls } =
        useCanvasSettings()

    const navigate = useNavigate()
    const track = TRACKS['main_circuit']

    useEffect(() => {
        document.title = 'Editor de Pista - Administración 🏎️🛠️'
    }, [])

    const handleBackToAdmin = () => {
        navigate('/admin')
    }

    return (
        <div className="absolute top-4 left-4 bg-white/90 rounded shadow-lg p-4 z-50 min-w-[250px]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-sm">
                    🛠️ Editor de Pista
                </h3>
                <button
                    onClick={handleBackToAdmin}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                    title="Volver al panel de administración"
                >
                    Volver
                </button>
            </div>

            {/* Track Information */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    📊 Información de la Pista
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                    <div>
                        Nombre:{' '}
                        <span className="font-medium">{track.name}</span>
                    </div>
                    <div>
                        Waypoints:{' '}
                        <span className="font-medium">
                            {track.waypoints.length}
                        </span>
                    </div>
                    <div>
                        Longitud:{' '}
                        <span className="font-medium">
                            {Math.round(track.length)}m
                        </span>
                    </div>
                    <div>
                        Estado:{' '}
                        <span className="font-medium text-green-600">
                            Editable
                        </span>
                    </div>
                </div>
            </div>

            {/* Debug and Visualization Controls */}
            <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    🔧 Controles de Debug
                </h4>

                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-800 text-sm">
                    <input
                        type="checkbox"
                        checked={showWaypoints}
                        onChange={e => setShowWaypoints(e.target.checked)}
                        className="accent-orange-600"
                    />
                    Mostrar waypoints
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-800 text-sm">
                    <input
                        type="checkbox"
                        checked={showWalls}
                        onChange={e => setShowWalls(e.target.checked)}
                        className="accent-red-600"
                    />
                    Mostrar paredes
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-800 text-sm">
                    <input type="checkbox" className="accent-purple-600" />
                    Modo edición de waypoints
                </label>
            </div>

            {/* Track Editor Tips */}
            <div className="border-t pt-3 mt-3">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    💡 Consejos
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                    <div>
                        • Los waypoints definen la ruta que seguirán los autos
                    </div>
                    <div>
                        • Mantén al menos 3 waypoints para una pista válida
                    </div>
                    <div>• Las paredes delimitan el área de carrera</div>
                    <div>
                        • Usa las herramientas de debug para visualizar mejor
                    </div>
                </div>
            </div>

            {/* Save/Export Options (Future feature) */}
            <div className="border-t pt-3 mt-3">
                <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    💾 Acciones
                </h4>
                <div className="space-y-2">
                    <button
                        onClick={() => {
                            // TODO: Implement save functionality
                            alert('Función de guardado próximamente')
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs transition-colors"
                        disabled
                    >
                        Guardar pista (próximamente)
                    </button>

                    <button
                        onClick={() => {
                            // TODO: Implement export functionality
                            alert('Función de exportar próximamente')
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs transition-colors"
                        disabled
                    >
                        Exportar configuración (próximamente)
                    </button>
                </div>
            </div>
        </div>
    )
}
