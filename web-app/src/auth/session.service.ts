import type { AuthSession, StorageAdapter } from './types.ts';

export const SESSION_KEY = 'auth:session';

/** Builds the storage key for a user record.
 * @param id Hexadecimal SHA-256 hash of the normalized email.
 * @returns A key with the `user:` prefix.
 * @example userKey('a'.repeat(64));
 */
export function userKey(id: string): string {
  return `user:${id}`;
}

/** Validates the basic shape of a deserialized session.
 * @param value Unknown value read from storage.
 * @returns `true` if it has the expected fields.
 * @example if (isSession(value)) console.log(value.userId);
 */
function isSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AuthSession>;
  return typeof candidate.sessionId === 'string' && candidate.sessionId.length > 0
    && typeof candidate.userId === 'string' && /^[a-f0-9]{64}$/.test(candidate.userId)
    && typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt)
    && candidate.createdAt > 0 && candidate.createdAt <= Date.now();
}

export class SessionService {
  private readonly storage: StorageAdapter;
  /** Creates a session manager.
   * @param storage Shared storage adapter.
   * @example const sessions = new SessionService(storage);
   */
  constructor(storage: StorageAdapter) { this.storage = storage; }

  /** Reads a valid session whose user record still exists.
   * @returns The current session, or `null`.
   * @example const session = sessions.get();
   */
  get(): AuthSession | null {
    const session: unknown = this.storage.get(SESSION_KEY);
    if (!isSession(session) || !this.storage.has(userKey(session.userId))) return null;
    return session;
  }

  /** Generates and stores a session for a user.
   * @param userId Email hash of the authenticated user.
   * @returns A new session with a UUID and creation timestamp.
   * @example const session = sessions.create(userId);
   */
  create(userId: string): AuthSession {
    const session = { sessionId: crypto.randomUUID(), userId, createdAt: Date.now() };
    this.storage.set(SESSION_KEY, session);
    return session;
  }

  /** Removes the persisted session.
   * @returns Nothing.
   * @example sessions.clear();
   */
  clear(): void {
    this.storage.remove(SESSION_KEY);
  }
}
