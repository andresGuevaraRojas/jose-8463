import { createAuthService } from '../auth'
import type { AppUserData } from '../types/app'

export const authClient = createAuthService<AppUserData>({
  initialData: () => ({ balanceCents: 0, deposits: [] }),
})
