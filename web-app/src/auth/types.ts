export interface UserProfile {
  fullName: string;
  email: string;
}

export interface UserPayload<TData> {
  profile: UserProfile;
  data: TData;
}

export interface StoredUser {
  version: 1;
  id: string;
  iterations: number;
  salt: string;
  iv: string;
  encryptedData: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  createdAt: number;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface StorageAdapter {
  /** Reads and deserializes a storage entry.
   * @param key Storage key.
   * @returns The value, or `null` if the key does not exist.
   * @example storage.get<AuthSession>('auth:session');
   */
  get<T>(key: string): T | null;
  /** Serializes and saves a value.
   * @param key Storage key.
   * @param value Serializable value.
   * @returns Nothing.
   * @example storage.set('settings', { theme: 'dark' });
   */
  set<T>(key: string, value: T): void;
  /** Removes a storage entry.
   * @param key Storage key.
   * @returns Nothing.
   * @example storage.remove('auth:session');
   */
  remove(key: string): void;
  /** Checks whether a storage entry exists.
   * @param key Storage key.
   * @returns `true` if the key exists.
   * @example storage.has('auth:session');
   */
  has(key: string): boolean;
}

export interface AuthServiceOptions<TData> {
  initialData: TData | (() => TData);
  minPasswordLength?: number;
  pbkdf2Iterations?: number;
  storage?: StorageAdapter;
}

export interface AuthService<TData> {
  /** Registers a user and encrypts the profile and initial data without starting a session.
   * @param input Full name, email, password, and confirmation.
   * @returns A promise that resolves after the record is saved.
   * @example await auth.register({ fullName: 'Ana', email: 'ana@example.com', password: 'secret123', passwordConfirmation: 'secret123' });
   */
  register(input: RegisterInput): Promise<void>;
  /** Validates credentials, creates a session, and unlocks this instance's vault.
   * @param input Email and password.
   * @returns The newly created session.
   * @example const session = await auth.login({ email: 'ana@example.com', password: 'secret123' });
   */
  login(input: LoginInput): Promise<AuthSession>;
  /** Derives the key again after a page reload without creating a new session.
   * @param password Password for the user in the active session.
   * @returns A promise that resolves when the vault is unlocked.
   * @example if (auth.isAuthenticated()) await auth.unlock('secret123');
   */
  unlock(password: string): Promise<void>;
  /** Ends the session and clears the in-memory key while preserving encrypted user data.
   * @returns Nothing.
   * @example auth.logout();
   */
  logout(): void;
  /** Checks that the stored session has a valid shape and an associated user record.
   * @returns `true` if such a local session exists.
   * @example const active = auth.isAuthenticated();
   */
  isAuthenticated(): boolean;
  /** Gets the valid local session even when the vault remains locked.
   * @returns The session, or `null`.
   * @example const session = auth.getSession();
   */
  getSession(): AuthSession | null;
  /** Checks whether this instance holds the key for the current session.
   * @returns `true` if it can decrypt user data.
   * @example if (!auth.hasUnlockedVault()) await auth.unlock('secret123');
   */
  hasUnlockedVault(): boolean;
  /** Decrypts and returns the current user's profile.
   * @returns The profile with full name and email.
   * @example const profile = await auth.getCurrentUser();
   */
  getCurrentUser(): Promise<UserProfile>;
  /** Decrypts and returns the current user's application data.
   * @returns Data typed as `TData`.
   * @example const data = await auth.getUserData();
   */
  getUserData(): Promise<TData>;
  /** Replaces all application data and re-encrypts it with a fresh IV.
   * @param data Complete new `TData` value.
   * @returns A promise that resolves after the change is saved.
   * @example await auth.setUserData({ cart: [], preferences: { theme: 'dark' } });
   */
  setUserData(data: TData): Promise<void>;
  /** Updates application data based on its current value.
   * @param updater Synchronous function that returns the new `TData` value.
   * @returns A promise that resolves after the change is saved.
   * @example await auth.updateUserData(current => ({ ...current, cart: [...current.cart, item] }));
   */
  updateUserData(updater: (current: TData) => TData): Promise<void>;
  /** Updates the profile and data together; email changes are not supported here.
   * @param updater Synchronous function that returns the complete payload.
   * @returns A promise that resolves after the change is saved.
   * @example await auth.updateUserPayload(current => ({ ...current, profile: { ...current.profile, fullName: 'Ana Ruiz' } }));
   */
  updateUserPayload(updater: (current: UserPayload<TData>) => UserPayload<TData>): Promise<void>;
  /** Changes the current user's full name and re-encrypts the record.
   * @param fullName New non-empty full name.
   * @returns A promise that resolves after the change is saved.
   * @example await auth.updateFullName('Ana Ruiz');
   */
  updateFullName(fullName: string): Promise<void>;
}
