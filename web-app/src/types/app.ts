export interface Deposit {
  id: string
  amountCents: number
  createdAt: string
}

export interface AppUserData {
  balanceCents: number
  deposits: Deposit[]
}

export type AuthScreen = 'login' | 'register' | 'unlock'

export interface PaymentInput {
  cardNumber: string
  expiry: string
  cvv: string
  cardholder: string
  amount: string
}
