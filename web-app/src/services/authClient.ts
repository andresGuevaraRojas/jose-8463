import { createAuthService } from '../auth'
import type { AppUserData } from '../types/app'
import { createInitialBets } from './raceService'

export const authClient = createAuthService<AppUserData>({
  initialData: () => ({ balanceCents: 0, deposits: [], bets: createInitialBets() }),
})
