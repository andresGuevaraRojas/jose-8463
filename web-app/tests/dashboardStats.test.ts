import { describe, expect, it } from 'vitest'
import { dashboardStats } from '../src/services/dashboardStats.ts'
import type { AppUserData, BetRecord } from '../src/types/app.ts'

const today = new Date(2026, 9, 3, 15)
const empty: AppUserData = { balanceCents: 0, deposits: [], bets: [] }
const bet = (id: string, snailId: string, status: 'won' | 'lost', createdAt: string): BetRecord => ({
  id, snailId, snailName: snailId, amountCents: 100, odds: 2, winnerId: snailId,
  status, payoutCents: status === 'won' ? 200 : 0, createdAt,
})

describe('estadísticas de la cuenta', () => {
  it('empieza en cero para una cuenta nueva', () => {
    const stats = dashboardStats(empty, today)
    expect(stats.racesToday).toBe(0)
    expect(stats.won).toBe(0)
    expect(stats.lost).toBe(0)
    expect(stats.snails.every((snail) => snail.wins === 0)).toBe(true)
  })

  it('cuenta carreras del día local y victorias propias por caracol', () => {
    const data: AppUserData = { ...empty, bets: [
      bet('1', 'rayo', 'won', new Date(2026, 9, 3, 9).toISOString()),
      bet('2', 'lola', 'lost', new Date(2026, 9, 3, 11).toISOString()),
      bet('3', 'rayo', 'won', new Date(2026, 9, 2, 11).toISOString()),
    ] }
    const stats = dashboardStats(data, today)
    expect(stats.racesToday).toBe(2)
    expect(stats.won).toBe(2)
    expect(stats.lost).toBe(1)
    expect(stats.snails.find((snail) => snail.name === 'Rayo')?.wins).toBe(2)
  })
})
