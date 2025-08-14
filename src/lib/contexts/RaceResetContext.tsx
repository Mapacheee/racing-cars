import { createContext, useContext, useState, type ReactNode } from 'react'

type RaceResetContextType = {
    resetCounter: number
    triggerReset: () => void
}

const RaceResetContext = createContext<RaceResetContextType | undefined>(undefined)

export function RaceResetProvider({ children }: { children: ReactNode }) {
    const [resetCounter, setResetCounter] = useState(0)
    
    const triggerReset = () => {
        setResetCounter(prev => prev + 1)
    }
    
    return (
        <RaceResetContext.Provider value={{ resetCounter, triggerReset }}>
            {children}
        </RaceResetContext.Provider>
    )
}

export function useRaceReset() {
    const ctx = useContext(RaceResetContext)
    if (!ctx) {
        throw new Error('useRaceReset debe estar con RaceResetProvider')
    }
    return ctx
}
