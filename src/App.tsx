import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom'
import TrainingMenu from './routes/training/menu/index.tsx'
import ProtectedRoute from './lib/components/ProtectedRoute.tsx'
import { AdminRoomProvider } from './lib/contexts/AdminRoomContext.tsx'
import { PlayerRoomProvider } from './lib/contexts/PlayerRoomContext.tsx'
import type { JSX } from 'react'
import Home from './routes/index.tsx'
import AdminHome from './routes/admin/index.tsx'
import TrainingSimulation from './routes/training/simulation/index.tsx'
import AdminMenu from './routes/admin/menu/index.tsx'
import { RaceDetail } from './routes/admin/races/RaceDetail.tsx'
import { CreateRaceForm } from './routes/admin/races/CreateRaceForm.tsx'
import { RaceList } from './routes/admin/races/RaceList.tsx'
import AdminRoom from './routes/admin/room/index.tsx'
import PlayerRoom from './routes/training/room/index.tsx'
import TrackEditor from './routes/admin/track-editor/index.tsx'
import RacingCompetition from './routes/admin/racing-competition/index.tsx'

export default function App(): JSX.Element {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route element={<ProtectedRoute redirectIfLoggedIn />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<AdminHome />} />
                </Route>

                {/* Private routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<PlayerRoomProvider />}>
                        <Route
                            path="/training/menu"
                            element={<TrainingMenu />}
                        />
                        <Route path="/training/room" element={<PlayerRoom />} />
                        <Route
                            path="/training/simulation"
                            element={<TrainingSimulation />}
                        />
                        <Route
                            path="/training/*"
                            element={<Navigate to="/training/menu" replace />}
                        />
                    </Route>

                    <Route element={<AdminRoomProvider />}>
                        <Route path="/admin/menu" element={<AdminMenu />} />
                        <Route path="/admin/room" element={<AdminRoom />} />
                        <Route
                            path="/admin/track-editor"
                            element={<TrackEditor />}
                        />
                        <Route
                            path="/admin/racing-competition"
                            element={<RacingCompetition />}
                        />

                        <Route path="/admin/list" element={<RaceList />} />
                        <Route
                            path="/admin/create"
                            element={<CreateRaceForm />}
                        />
                        <Route path="/admin/:id" element={<RaceDetail />} />

                        {/* Default redirect for /admin */}
                        <Route
                            path="/admin/*"
                            element={<Navigate to="/admin/menu" replace />}
                        />
                    </Route>

                    {/* Default route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </Router>
    )
}
