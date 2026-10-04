export interface Deposit {
  id: string
  amountCents: number
  createdAt: string
}

export interface AppUserData {
  balanceCents: number
  deposits: Deposit[]
  bets: BetRecord[]
}

export type BetStatus = 'won' | 'lost'

export interface BetRecord {
  id: string
  sample?: boolean
  snailId: string
  snailName: string
  amountCents: number
  odds: number
  winnerId: string
  status: BetStatus
  payoutCents: number
  createdAt: string
}

export type AuthScreen = 'login' | 'register' | 'unlock'

export interface PaymentInput {
  cardNumber: string
  expiry: string
  cvv: string
  cardholder: string
  amount: string
}

export interface BetInput {
  amount: string
}
