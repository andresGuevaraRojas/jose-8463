import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useActiveUser, useAuth } from '../auth/auth-context'
import { AuthLayout } from '../components/AuthLayout'
import { BetsPage } from '../pages/BetsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { RacePage } from '../pages/RacePage'
import { preserveSnailPayTestMode } from '../services/snailPayTestMode'

function LoadingScreen() {
  return <div role="status" className="grid min-h-screen place-items-center bg-cream text-forest">Cargando tu cuenta...</div>
}

export function HomeRedirect() {
  const { state } = useAuth()
  const { search } = useLocation()
  if (state.status === 'loading') return <LoadingScreen />
  const destination = state.status === 'ready' ? '/dashboard' : state.status === 'locked' ? '/unlock' : '/login'
  return <Navigate to={preserveSnailPayTestMode(destination, search)} replace />
}

export function GuestLayout() {
  const { state } = useAuth()
  const { search } = useLocation()
  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'locked') return <Navigate to={preserveSnailPayTestMode('/unlock', search)} replace />
  if (state.status === 'ready') return <Navigate to={preserveSnailPayTestMode('/dashboard', search)} replace />
  return <AuthLayout />
}

export function UnlockLayout() {
  const { state } = useAuth()
  const { search } = useLocation()
  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'guest') return <Navigate to={preserveSnailPayTestMode('/login', search)} replace />
  if (state.status === 'ready') return <Navigate to={preserveSnailPayTestMode('/dashboard', search)} replace />
  return <AuthLayout />
}

export function ProtectedLayout() {
  const { state } = useAuth()
  const { search } = useLocation()
  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'guest') return <Navigate to={preserveSnailPayTestMode('/login', search)} replace />
  if (state.status === 'locked') return <Navigate to={preserveSnailPayTestMode('/unlock', search)} replace />
  return <Outlet />
}

export function DashboardRoute() {
  const { user, logout, deposit } = useActiveUser()
  const navigate = useNavigate()
  const { search } = useLocation()
  return <DashboardPage profile={user.profile} data={user.data} payerId={user.payerId} onLogout={logout} onDeposit={deposit} onStartRace={() => navigate(preserveSnailPayTestMode('/races', search))} />
}

export function RaceRoute() {
  const { user, logout, settleBet } = useActiveUser()
  return <RacePage profile={user.profile} data={user.data} onLogout={logout} onSettleBet={settleBet} />
}

export function BetsRoute() {
  const { user, logout } = useActiveUser()
  return <BetsPage profile={user.profile} data={user.data} onLogout={logout} />
}
