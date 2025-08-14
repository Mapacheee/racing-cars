export type Weather = 'sunny' | 'cloudy' | 'rainy';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type RaceStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface RaceFormData {
    trackId: string;
    aiModels: string[];
    raceConditions: {
        weather: Weather;
        difficulty: Difficulty;
        numberOfParticipants: number;
    };
    raceConfig: {
        numberOfLaps: number;
        maxTime?: number;
    };
}

export interface Track {
    id: string;
    name: string;
    description: string;
    length: number;
    difficulty: Difficulty;
}

export interface AIModel {
    id: string;
    name: string;
    userId: string;
    username: string;
    performance: {
        wins: number;
        races: number;
        bestLapTime: number;
    };
}

export interface Race extends RaceFormData {
    id: string;
    status: RaceStatus;
    createdAt: string;
    updatedAt: string;
    results?: RaceResult[];
}

export interface RaceResult {
    aiModelId: string;
    position: number;
    bestLapTime: number;
    totalTime: number;
    averageSpeed: number;
}
