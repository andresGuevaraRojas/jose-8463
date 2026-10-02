import { decryptPayload, deriveKey, encryptPayload, normalizeEmail, randomSalt, sha256, toBase64, fromBase64 } from './crypto.service.ts';
import { InvalidCredentialsError, NoActiveSessionError, UserAlreadyExistsError, ValidationError, VaultLockedError } from './errors.ts';
import { SessionService, userKey } from './session.service.ts';
import { LocalStorageAdapter } from './storage.service.ts';
import type { AuthService, AuthServiceOptions, AuthSession, LoginInput, RegisterInput, StoredUser, StorageAdapter, UserPayload, UserProfile } from './types.ts';

export const DEFAULT_PBKDF2_ITERATIONS = 310_000;
export const DEFAULT_MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates a stored record before deriving or using its key.
 * @param value Deserialized value.
 * @param id Expected email hash.
 * @returns Nothing; throws `InvalidCredentialsError` if invalid.
 * @example assertRecord(storage.get(userKey(id)), id);
 */
function assertRecord(value: unknown, id: string): asserts value is StoredUser {
  if (typeof value !== 'object' || value === null) throw new InvalidCredentialsError();
  const record = value as Partial<StoredUser>;
  if (record.version !== 1 || record.id !== id
    || !Number.isSafeInteger(record.iterations) || (record.iterations ?? 0) < 1
    || typeof record.salt !== 'string' || typeof record.iv !== 'string'
    || typeof record.encryptedData !== 'string') {
    throw new InvalidCredentialsError();
  }
}

/** Checks that the decrypted payload belongs to the requested index.
 * @param payload Decrypted data.
 * @param id Expected email hash.
 * @returns A promise that resolves if the email matches.
 * @example await assertPayload(payload, id);
 */
function assertPayload<TData>(payload: UserPayload<TData>, id: string): Promise<void> {
  if (typeof payload !== 'object' || payload === null || typeof payload.profile !== 'object'
    || payload.profile === null || typeof payload.profile.fullName !== 'string'
    || typeof payload.profile.email !== 'string' || !('data' in payload)) {
    throw new InvalidCredentialsError();
  }
  return sha256(normalizeEmail(payload.profile.email)).then((actualId) => {
    if (actualId !== id) throw new InvalidCredentialsError();
  });
}

/** Creates a local authentication service with typed application data.
 * @typeParam TData JSON-serializable shape of the application's user data.
 * @param options Initial data, validation and encryption settings, and optional storage adapter.
 * @returns A service for registration, sessions, and encrypted user data.
 * @example const auth = createAuthService<{ cart: string[] }>({ initialData: { cart: [] } });
 */
export function createAuthService<TData>(options: AuthServiceOptions<TData>): AuthService<TData> {
  const minPasswordLength = options.minPasswordLength ?? DEFAULT_MIN_PASSWORD_LENGTH;
  const iterations = options.pbkdf2Iterations ?? DEFAULT_PBKDF2_ITERATIONS;
  if (!Number.isSafeInteger(minPasswordLength) || minPasswordLength < 1) {
    throw new ValidationError('minPasswordLength must be a positive integer');
  }
  if (!Number.isSafeInteger(iterations) || iterations < 1) {
    throw new ValidationError('pbkdf2Iterations must be a positive integer');
  }

  const storage: StorageAdapter = options.storage ?? new LocalStorageAdapter();
  const sessions = new SessionService(storage);
  let unlocked: { sessionId: string; userId: string; key: CryptoKey } | null = null;
  let pendingUpdate: Promise<void> = Promise.resolve();

  /** Requires a valid local session.
   * @returns The current session.
   * @example const session = currentSession();
   */
  function currentSession(): AuthSession {
    const session = sessions.get();
    if (!session) {
      unlocked = null;
      throw new NoActiveSessionError();
    }
    return session;
  }

  /** Requires an in-memory key for the current session.
   * @returns The session and its key.
   * @example const { key } = currentKey();
   */
  function currentKey(): { session: AuthSession; key: CryptoKey } {
    const session = currentSession();
    if (!unlocked || unlocked.sessionId !== session.sessionId || unlocked.userId !== session.userId) {
      unlocked = null;
      throw new VaultLockedError();
    }
    return { session, key: unlocked.key };
  }

  /** Reads and validates an encrypted user record.
   * @param id Email hash.
   * @returns The stored record.
   * @example const record = readRecord(id);
   */
  function readRecord(id: string): StoredUser {
    const value: unknown = storage.get(userKey(id));
    assertRecord(value, id);
    return value;
  }

  /** Decrypts the current user's payload.
   * @returns The profile and application data.
   * @example const payload = await readPayload();
   */
  async function readPayload(): Promise<UserPayload<TData>> {
    const { session, key } = currentKey();
    const payload = await decryptPayload<TData>(readRecord(session.userId), key);
    await assertPayload(payload, session.userId);
    return payload;
  }

  /** Runs writes sequentially within this service instance.
   * @param operation Asynchronous write to run in order.
   * @returns The requested operation's promise.
   * @example await enqueueUpdate(async () => { await save(); });
   */
  function enqueueUpdate(operation: () => Promise<void>): Promise<void> {
    const next = pendingUpdate.then(operation);
    pendingUpdate = next.catch(() => undefined);
    return next;
  }

  /** Applies an update, encrypts with a fresh IV, and persists the record.
   * @param updater Synchronous payload transformation.
   * @returns A promise that resolves after the data is saved.
   * @example await updatePayload(current => ({ ...current, data: nextData }));
   */
  async function updatePayload(updater: (current: UserPayload<TData>) => UserPayload<TData>): Promise<void> {
    return enqueueUpdate(async () => {
      const { session, key } = currentKey();
      const record = readRecord(session.userId);
      const current = await decryptPayload<TData>(record, key);
      await assertPayload(current, session.userId);
      const updated = updater(current);
      if (typeof updated !== 'object' || updated === null || typeof updated.profile !== 'object'
        || updated.profile === null || typeof updated.profile.fullName !== 'string'
        || !updated.profile.fullName.trim() || updated.profile.email !== current.profile.email
        || !('data' in updated)) {
        throw new ValidationError('Invalid payload; email changes are not supported');
      }
      // Recheck the session after asynchronous crypto work, before writing.
      if (sessions.get()?.sessionId !== session.sessionId) throw new NoActiveSessionError();
      const encrypted = await encryptPayload(updated, key, record);
      if (sessions.get()?.sessionId !== session.sessionId) throw new NoActiveSessionError();
      storage.set(userKey(session.userId), encrypted);
    });
  }

  return {
    async register(input: RegisterInput): Promise<void> {
      const fullName = input.fullName.trim();
      const email = normalizeEmail(input.email);
      if (!fullName) throw new ValidationError('Full name is required');
      if (!email || !EMAIL_PATTERN.test(email)) throw new ValidationError('Valid email is required');
      if (!input.password || input.password.length < minPasswordLength) {
        throw new ValidationError(`Password must have at least ${minPasswordLength} characters`);
      }
      if (input.password !== input.passwordConfirmation) throw new ValidationError('Passwords do not match');
      const id = await sha256(email);
      if (storage.has(userKey(id))) throw new UserAlreadyExistsError();
      const salt = randomSalt();
      const key = await deriveKey(input.password, salt, iterations);
      const data = typeof options.initialData === 'function'
        ? (options.initialData as () => TData)()
        : options.initialData;
      const record = await encryptPayload(
        { profile: { fullName, email }, data },
        key,
        { version: 1, id, iterations, salt: toBase64(salt) },
      );
      if (storage.has(userKey(id))) throw new UserAlreadyExistsError();
      storage.set(userKey(id), record);
    },

    async login(input: LoginInput): Promise<AuthSession> {
      unlocked = null;
      const id = await sha256(normalizeEmail(input.email));
      try {
        const record = readRecord(id);
        const key = await deriveKey(input.password, fromBase64(record.salt), record.iterations);
        const payload = await decryptPayload<TData>(record, key);
        await assertPayload(payload, id);
        const session = sessions.create(id);
        unlocked = { sessionId: session.sessionId, userId: id, key };
        return session;
      } catch (error) {
        if (error instanceof InvalidCredentialsError) throw error;
        // Authentication failures, including malformed records, share one public error.
        if (error instanceof DOMException || error instanceof TypeError || error instanceof SyntaxError) {
          throw new InvalidCredentialsError();
        }
        throw error;
      }
    },

    async unlock(password: string): Promise<void> {
      const session = currentSession();
      unlocked = null;
      try {
        const record = readRecord(session.userId);
        const key = await deriveKey(password, fromBase64(record.salt), record.iterations);
        const payload = await decryptPayload<TData>(record, key);
        await assertPayload(payload, session.userId);
        if (sessions.get()?.sessionId !== session.sessionId) throw new NoActiveSessionError();
        unlocked = { sessionId: session.sessionId, userId: session.userId, key };
      } catch (error) {
        if (error instanceof NoActiveSessionError) throw error;
        throw new InvalidCredentialsError();
      }
    },

    logout(): void {
      unlocked = null;
      sessions.clear();
    },

    isAuthenticated(): boolean { return sessions.get() !== null; },
    getSession(): AuthSession | null { return sessions.get(); },
    hasUnlockedVault(): boolean {
      const session = sessions.get();
      if (!session || !unlocked || unlocked.sessionId !== session.sessionId || unlocked.userId !== session.userId) {
        unlocked = null;
        return false;
      }
      return true;
    },
    async getCurrentUser(): Promise<UserProfile> { return (await readPayload()).profile; },
    async getUserData(): Promise<TData> { return (await readPayload()).data; },
    async setUserData(data: TData): Promise<void> {
      return updatePayload((current) => ({ ...current, data }));
    },
    async updateUserData(updater: (current: TData) => TData): Promise<void> {
      return updatePayload((current) => ({ ...current, data: updater(current.data) }));
    },
    updateUserPayload: updatePayload,
    async updateFullName(fullName: string): Promise<void> {
      return updatePayload((current) => ({ ...current, profile: { ...current.profile, fullName: fullName.trim() } }));
    },
  };
}
