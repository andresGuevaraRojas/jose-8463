import { racingSnails } from './raceService.ts'
import type { AppUserData } from '../types/app.ts'

export function dashboardStats(data: AppUserData, today = new Date()) {
  const bets = data.bets ?? []
  const won = bets.filter((bet) => bet.status === 'won').length
  const lost = bets.filter((bet) => bet.status === 'lost').length
  const racesToday = bets.filter((bet) => {
    const date = new Date(bet.createdAt)
    return !Number.isNaN(date.getTime()) && date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
  }).length
  const snails = racingSnails.map((snail) => ({
    name: snail.name,
    wins: bets.filter((bet) => bet.winnerId === snail.id).length,
    color: snail.accent,
  }))
  return { racesToday, won, lost, snails }
}
