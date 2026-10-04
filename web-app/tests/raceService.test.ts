import { describe, expect, it } from 'vitest'
import { createInitialBets, racingSnails, runSimulatedRace } from '../src/services/raceService.ts'
import { dashboardStats } from '../src/services/dashboardStats.ts'

describe('carrera simulada', () => {
  it('incluye los seis caracoles una vez y declara un ganador', () => {
    const race = runSimulatedRace(() => 0.75)
    expect(race.standings).toHaveLength(6)
    expect(new Set(race.standings.map((snail) => snail.id)).size).toBe(6)
    expect(racingSnails).toContain(race.winner)
    expect(race.standings[0]).toBe(race.winner)
  })

  it('precarga seis apuestas resueltas sin afectar el saldo inicial', () => {
    const today = new Date(2026, 9, 3, 12)
    let nextId = 0
    const bets = createInitialBets(today, () => `sample-${++nextId}`)
    expect(bets).toHaveLength(6)
    expect(new Set(bets.map((bet) => bet.id)).size).toBe(6)
    expect(bets.every((bet) => bet.sample && bet.amountCents === 0 && bet.payoutCents === 0)).toBe(true)
    const data = { balanceCents: 0, deposits: [], bets }
    const stats = dashboardStats(data, today)
    expect(stats.racesToday).toBe(6)
    expect(stats.won).toBe(3)
    expect(stats.lost).toBe(3)
    expect(stats.snails.reduce((total, snail) => total + snail.wins, 0)).toBe(6)
    expect(data.balanceCents).toBe(0)
  })
})
