import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { InvalidCredentialsError, UserAlreadyExistsError } from './auth'
import type { UserProfile } from './auth'
import { AuthPage, type AuthFormValues } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { RacePage } from './pages/RacePage'
import { authClient } from './services/authClient'
import { creditApprovedPayment, type PaymentReceipt } from './services/paymentService'
import { loginSchema, registrationSchema, unlockSchema } from './services/validationSchemas'
import type { AppUserData, AuthScreen, BetRecord } from './types/app'

function sessionDestination(): '/login' | '/unlock' | '/dashboard' {
  if (!authClient.isAuthenticated()) return '/login'
  return authClient.hasUnlockedVault() ? '/dashboard' : '/unlock'
}

function App() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userData, setUserData] = useState<AppUserData | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadDashboard() {
    const [currentProfile, currentData] = await Promise.all([
      authClient.getCurrentUser(),
      authClient.getUserData(),
    ])
    setProfile(currentProfile)
    setUserData(currentData)
    setError('')
  }

  useEffect(() => {
    if (!authClient.hasUnlockedVault()) return
    void Promise.all([authClient.getCurrentUser(), authClient.getUserData()])
      .then(([currentProfile, currentData]) => {
        setProfile(currentProfile)
        setUserData(currentData)
      })
      .catch(() => {
        authClient.logout()
        navigate('/login', { replace: true })
      })
  }, [navigate])

  async function submit(screen: AuthScreen, values: AuthFormValues) {
    setError('')
    setBusy(true)
    try {
      if (screen === 'register') {
        const result = registrationSchema.safeParse(values)
        if (!result.success) throw new Error(result.error.issues[0].message)
        const { fullName, email, password, confirmation } = result.data
        await authClient.register({ fullName, email, password, passwordConfirmation: confirmation })
        await authClient.login({ email, password })
      } else if (screen === 'unlock') {
        const result = unlockSchema.safeParse(values)
        if (!result.success) throw new Error(result.error.issues[0].message)
        await authClient.unlock(result.data.password)
      } else {
        const result = loginSchema.safeParse(values)
        if (!result.success) throw new Error(result.error.issues[0].message)
        await authClient.login(result.data)
      }
      await loadDashboard()
      navigate('/dashboard', { replace: true })
    } catch (cause) {
      if (cause instanceof UserAlreadyExistsError) setError('Ya existe una cuenta con este correo.')
      else if (cause instanceof InvalidCredentialsError) setError('Correo o contraseña incorrectos.')
      else setError(cause instanceof Error ? cause.message : 'No se pudo continuar. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  function logout() {
    authClient.logout()
    setProfile(null)
    setUserData(null)
    setError('')
    navigate('/login', { replace: true })
  }

  async function deposit(receipt: PaymentReceipt) {
    if (authClient.getSession()?.userId !== receipt.payerId) throw new Error('La sesión cambió. Vuelve a iniciar sesión.')
    await authClient.updateUserData((current) => creditApprovedPayment(current, receipt))
    setUserData(await authClient.getUserData())
  }

  async function settleBet(bet: BetRecord) {
    await authClient.updateUserData((current) => ({
      ...current,
      bets: [bet, ...(current.bets ?? [])],
      balanceCents: current.balanceCents - bet.amountCents + bet.payoutCents,
    }))
    setUserData(await authClient.getUserData())
  }

  function authPage(screen: AuthScreen) {
    return <AuthPage
      key={screen}
      screen={screen}
      error={error}
      busy={busy}
      onSubmit={(values) => submit(screen, values)}
      onNavigate={() => setError('')}
      onLogout={logout}
    />
  }

  const destination = sessionDestination()
  const payerId = authClient.getSession()?.userId ?? ''
  return <Routes>
    <Route path="/" element={<Navigate to={destination} replace />} />
    <Route path="/login" element={destination === '/login' ? authPage('login') : <Navigate to={destination} replace />} />
    <Route path="/register" element={destination === '/login' ? authPage('register') : <Navigate to={destination} replace />} />
    <Route path="/unlock" element={destination === '/unlock' ? authPage('unlock') : <Navigate to={destination} replace />} />
    <Route path="/dashboard" element={destination !== '/dashboard' ? <Navigate to={destination} replace /> :
      profile && userData ? <DashboardPage profile={profile} data={userData} onLogout={logout} onDeposit={deposit} payerId={payerId} onStartRace={() => navigate('/races')} /> :
        <div role="status" className="grid min-h-screen place-items-center bg-cream text-forest">Cargando tu panel...</div>} />
    <Route path="/races" element={destination !== '/dashboard' ? <Navigate to={destination} replace /> :
      profile && userData ? <RacePage profile={profile} data={userData} onLogout={logout} onSettleBet={settleBet} /> :
        <div role="status" className="grid min-h-screen place-items-center bg-cream text-forest">Cargando la carrera...</div>} />
    <Route path="*" element={<Navigate to={destination} replace />} />
  </Routes>
}

export default App
