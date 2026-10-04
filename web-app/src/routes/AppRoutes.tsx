import { Navigate, Outlet, useNavigate } from 'react-router'
import { useActiveUser, useAuth } from '../auth/auth-context'
import { AuthLayout } from '../components/AuthLayout'
import { BetsPage } from '../pages/BetsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { RacePage } from '../pages/RacePage'

function LoadingScreen() {
  return <div role="status" className="grid min-h-screen place-items-center bg-cream text-forest">Cargando tu cuenta...</div>
}

export function HomeRedirect() {
  const { state } = useAuth()
  if (state.status === 'loading') return <LoadingScreen />
  const destination = state.status === 'ready' ? '/dashboard' : state.status === 'locked' ? '/unlock' : '/login'
  return <Navigate to={destination} replace />
}

export function GuestLayout() {
  const { state } = useAuth()
  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'locked') return <Navigate to={'/unlock'} replace />
  if (state.status === 'ready') return <Navigate to={'/dashboard'} replace />
  return <AuthLayout />
}

export function UnlockLayout() {
  const { state } = useAuth()
  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'guest') return <Navigate to={'/login'} replace />
  if (state.status === 'ready') return <Navigate to={'/dashboard'} replace />
  return <AuthLayout />
}

export function ProtectedLayout() {
  const { state } = useAuth()
  if (state.status === 'loading') return <LoadingScreen />
  if (state.status === 'guest') return <Navigate to={'/login'} replace />
  if (state.status === 'locked') return <Navigate to={'/unlock'} replace />
  return <Outlet />
}

export function DashboardRoute() {
  const { user, logout, deposit } = useActiveUser()
  const navigate = useNavigate()
  return <DashboardPage profile={user.profile} data={user.data} payerId={user.payerId} onLogout={logout} onDeposit={deposit} onStartRace={() => navigate('/races')} />
}

export function RaceRoute() {
  const { user, logout, settleBet } = useActiveUser()
  return <RacePage profile={user.profile} data={user.data} onLogout={logout} onSettleBet={settleBet} />
}

export function BetsRoute() {
  const { user, logout } = useActiveUser()
  return <BetsPage profile={user.profile} data={user.data} onLogout={logout} />
}
