// Loading screen component
export default function LoadingScreen({ 
    message = 'Loading training simulation...' 
}: { 
    message?: string 
}) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-secondary">{message}</p>
            </div>
        </div>
    )
}
