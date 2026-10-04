import { createContext, useContext } from 'react'
import type { LoginInput, RegisterInput, UserProfile } from './types.ts'
import type { PaymentReceipt } from '../services/paymentService.ts'
import type { AppUserData, BetRecord } from '../types/app.ts'

export type AuthState =
  | { status: 'guest' | 'locked' | 'loading' }
  | { status: 'ready'; profile: UserProfile; data: AppUserData; payerId: string }

export interface AuthContextValue {
  state: AuthState
  register: (input: RegisterInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  unlock: (password: string) => Promise<void>
  logout: () => void
  deposit: (receipt: PaymentReceipt) => Promise<void>
  settleBet: (bet: BetRecord) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider no está disponible.')
  return context
}

export function useActiveUser() {
  const context = useAuth()
  if (context.state.status !== 'ready') throw new Error('La cuenta aún no está desbloqueada.')
  return { ...context, user: context.state }
}
