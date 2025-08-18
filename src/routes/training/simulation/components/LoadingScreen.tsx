import type { JSX } from 'react'

interface LoadingScreenProps {
    message?: string
}

export default function LoadingScreen({
    message = 'Cargando entrenamiento de IA...',
}: LoadingScreenProps): JSX.Element {
    return (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
                {/* Animated spinner */}
                <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>

                {/* Loading message */}
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {message}
                </h2>

                {/* Submessage */}
                <p className="text-gray-600 text-sm">
                    Inicializando datos de la IA desde el servidor...
                </p>

                {/* Animated dots */}
                <div className="flex justify-center space-x-1 mt-4">
                    <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                    ></div>
                </div>

                {/* Technical info */}
                <div className="mt-6 text-xs text-gray-500 space-y-1">
                    <div>🧠 Cargando algoritmo NEAT</div>
                    <div>🚗 Preparando coches autónomos</div>
                    <div>🏁 Configurando pista de entrenamiento</div>
                </div>
            </div>
        </div>
    )
}
