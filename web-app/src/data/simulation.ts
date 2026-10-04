export interface SnailResult {
  name: string
  wins: number
  color: string
}

export const money = (cents: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100)
