export interface SnailResult {
  name: string
  wins: number
  color: string
}

export const simulatedBets = { won: 8, lost: 4 } as const
export const simulatedSnails: readonly SnailResult[] = [
  { name: 'Turbo', wins: 2, color: '#c4e58f' },
  { name: 'Canela', wins: 1, color: '#f1b99b' },
  { name: 'Rayo', wins: 1, color: '#e5e8da' },
  { name: 'Menta', wins: 1, color: '#b3dc9a' },
  { name: 'Chispa', wins: 1, color: '#f1b99b' },
  { name: 'Luna', wins: 0, color: '#dae5da' },
]
export const simulatedRaceCount = 6
export const money = (cents: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100)
