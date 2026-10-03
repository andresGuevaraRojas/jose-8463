import { describe, expect, it } from 'vitest'
import { racingSnails, runSimulatedRace } from '../src/services/raceService.ts'

describe('carrera simulada', () => {
  it('incluye los seis caracoles una vez y declara un ganador', () => {
    const race = runSimulatedRace(() => 0.75)
    expect(race.standings).toHaveLength(6)
    expect(new Set(race.standings.map((snail) => snail.id)).size).toBe(6)
    expect(racingSnails).toContain(race.winner)
    expect(race.standings[0]).toBe(race.winner)
  })
})
