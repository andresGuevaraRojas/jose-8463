export interface RacingSnail {
  id: string
  name: string
  personality: string
  trait: string
  odds: number
  emoji: string
  accent: string
  portrait: string
}

export interface SimulatedRace {
  winner: RacingSnail
  standings: RacingSnail[]
}

export const racingSnails: readonly RacingSnail[] = [
  { id: 'rayo', name: 'Rayo', personality: 'Audaz', trait: 'Gafas de sol y camisa roja', odds: 2, emoji: '🐌😎', accent: '#e9f4d8', portrait: '/snails/rayo.svg' },
  { id: 'don-bigotes', name: 'Don Bigotes', personality: 'Metódico', trait: 'Bigote y paso a paso', odds: 3.5, emoji: '🐌🥸', accent: '#f1eadb', portrait: '/snails/don-bigotes.svg' },
  { id: 'lola', name: 'Lola', personality: 'Optimista', trait: 'Sombrero de verano', odds: 3, emoji: '🐌👒', accent: '#fde9e2', portrait: '/snails/lola.svg' },
  { id: 'capitan-concha', name: 'Capitán Concha', personality: 'Competitivo', trait: 'Gorra de campeón', odds: 2.5, emoji: '🐌🧢', accent: '#ddecde', portrait: '/snails/capitan-concha.svg' },
  { id: 'profesor-baba', name: 'Profesor Baba', personality: 'Analítico', trait: 'Gafas redondas y pajarita', odds: 4, emoji: '🐌🤓', accent: '#eee9f4', portrait: '/snails/profesor-baba.svg' },
  { id: 'frida', name: 'Frida', personality: 'Creativa', trait: 'Bufanda de colores', odds: 4.5, emoji: '🐌🧣', accent: '#f9ead5', portrait: '/snails/frida.svg' },
]

export function runSimulatedRace(random = Math.random): SimulatedRace {
  const shuffled = [...racingSnails].sort(() => random() - 0.5)
  return { winner: shuffled[0], standings: shuffled }
}

export function currentRaceTimestamp(): string {
  return new Date().toISOString()
}
