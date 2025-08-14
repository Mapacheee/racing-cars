/**
 * Simple keyboard input handler for debugging car controls
 */
export class KeyboardInput {
    private keys: Set<string> = new Set()
    private isListening: boolean = false

    constructor() {
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
    }

    startListening(): void {
        if (this.isListening) {
            console.log(
                '🔧 KeyboardInput.startListening() called but already listening'
            )
            return
        }

        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)
        this.isListening = true

        console.log('🎮 Keyboard controls activated for car ai-1:')
        console.log('  W/S - Throttle/Brake')
        console.log('  A/D - Steering')
        console.log('  Press Escape to disable manual control')
        console.log('🔧 Event listeners attached:', {
            hasKeydown: !!window.addEventListener,
            isListening: this.isListening,
            windowExists: !!window,
            timestamp: new Date().toLocaleTimeString(),
        })
    }

    stopListening(): void {
        if (!this.isListening) return

        window.removeEventListener('keydown', this.handleKeyDown)
        window.removeEventListener('keyup', this.handleKeyUp)
        this.isListening = false
        this.keys.clear()

        console.log('🎮 Keyboard controls deactivated')
    }

    private handleKeyDown(event: KeyboardEvent): void {
        const key = event.key.toLowerCase()
        this.keys.add(key)

        // Escape key disables manual control
        if (key === 'escape') {
            this.stopListening()
        }
    }

    private handleKeyUp(event: KeyboardEvent): void {
        const key = event.key.toLowerCase()
        this.keys.delete(key)
    }

    /**
     * Get current control actions based on pressed keys
     */
    getControlActions(): { throttle: number; steering: number } {
        let throttle = 0
        let steering = 0

        // WASD controls
        if (this.keys.has('w')) throttle += 1
        if (this.keys.has('s')) throttle -= 1
        if (this.keys.has('a')) steering -= 1
        if (this.keys.has('d')) steering += 1

        // Clamp values
        throttle = Math.max(-1, Math.min(1, throttle))
        steering = Math.max(-1, Math.min(1, steering))

        // Debug: Always log when getControlActions is called
        if (Math.random() < 0.1) {
            console.log('🎮 KeyboardInput.getControlActions():', {
                keysPressed: Array.from(this.keys),
                throttle,
                steering,
                isListening: this.isListening,
            })
        }

        return { throttle, steering }
    }

    isActive(): boolean {
        const active = this.isListening
        return active
    }

    hasActiveInput(): boolean {
        return this.keys.size > 0 && this.isListening
    }

    // Debug method to get current keys
    getCurrentKeys(): string[] {
        return Array.from(this.keys)
    }
}

// Global keyboard input instance
export const globalKeyboardInput = new KeyboardInput()
