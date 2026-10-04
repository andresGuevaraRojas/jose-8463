import { Route, Routes } from 'react-router'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { UnlockPage } from './pages/UnlockPage'
import {
  BetsRoute, DashboardRoute, GuestLayout, HomeRedirect,
  ProtectedLayout, RaceRoute, UnlockLayout,
} from './routes/AppRoutes'

function App() {
  return <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route element={<GuestLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
    <Route element={<UnlockLayout />}>
      <Route path="/unlock" element={<UnlockPage />} />
    </Route>
    <Route element={<ProtectedLayout />}>
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/races" element={<RaceRoute />} />
      <Route path="/bets" element={<BetsRoute />} />
    </Route>
    <Route path="*" element={<HomeRedirect />} />
  </Routes>
}

export default App
