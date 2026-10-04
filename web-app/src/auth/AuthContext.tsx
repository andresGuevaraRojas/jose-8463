import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { LoginInput, RegisterInput } from './types.ts'
import { authClient } from '../services/authClient'
import { creditApprovedPayment, type PaymentReceipt } from '../services/paymentService'
import type { BetRecord } from '../types/app'
import { AuthContext, type AuthState } from './auth-context'

function initialState(): AuthState {
  if (!authClient.isAuthenticated()) return { status: 'guest' }
  return authClient.hasUnlockedVault() ? { status: 'loading' } : { status: 'locked' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const revision = useRef(0)
  const hydrateOnMount = useRef(state.status === 'loading')

  const loadUnlocked = useCallback(async () => {
    const currentRevision = ++revision.current
    setState({ status: 'loading' })
    try {
      const [profile, data] = await Promise.all([authClient.getCurrentUser(), authClient.getUserData()])
      const payerId = authClient.getSession()?.userId
      if (!payerId) throw new Error('La sesión ya no está activa.')
      if (revision.current === currentRevision) setState({ status: 'ready', profile, data, payerId })
    } catch (cause) {
      if (revision.current === currentRevision) {
        authClient.logout()
        setState({ status: 'guest' })
      }
      throw cause
    }
  }, [])

  useEffect(() => {
    if (!hydrateOnMount.current) return
    void loadUnlocked().catch(() => {})
  }, [loadUnlocked])

  async function register(input: RegisterInput) {
    await authClient.register(input)
    await authClient.login({ email: input.email, password: input.password })
    await loadUnlocked()
  }

  async function login(input: LoginInput) {
    await authClient.login(input)
    await loadUnlocked()
  }

  async function unlock(password: string) {
    await authClient.unlock(password)
    await loadUnlocked()
  }

  function logout() {
    revision.current++
    authClient.logout()
    setState({ status: 'guest' })
  }

  async function deposit(receipt: PaymentReceipt) {
    if (authClient.getSession()?.userId !== receipt.payerId) throw new Error('La sesión cambió. Vuelve a iniciar sesión.')
    await authClient.updateUserData((current) => creditApprovedPayment(current, receipt))
    const data = await authClient.getUserData()
    setState((current) => current.status === 'ready' && current.payerId === receipt.payerId ? { ...current, data } : current)
  }

  async function settleBet(bet: BetRecord) {
    const payerId = authClient.getSession()?.userId
    if (!payerId) throw new Error('La sesión cambió. Vuelve a iniciar sesión.')
    await authClient.updateUserData((current) => ({
      ...current,
      bets: [bet, ...(current.bets ?? [])],
      balanceCents: current.balanceCents - bet.amountCents + bet.payoutCents,
    }))
    const data = await authClient.getUserData()
    setState((current) => current.status === 'ready' && current.payerId === payerId ? { ...current, data } : current)
  }

  return <AuthContext.Provider value={{ state, register, login, unlock, logout, deposit, settleBet }}>{children}</AuthContext.Provider>
}
