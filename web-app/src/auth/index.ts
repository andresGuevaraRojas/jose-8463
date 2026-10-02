export { createAuthService, DEFAULT_MIN_PASSWORD_LENGTH, DEFAULT_PBKDF2_ITERATIONS } from './auth.service.ts';
export { LocalStorageAdapter } from './storage.service.ts';
export { AuthError, ValidationError, InvalidCredentialsError, UserAlreadyExistsError, NoActiveSessionError, VaultLockedError, StorageError } from './errors.ts';
export type { AuthService, AuthServiceOptions, AuthSession, LoginInput, RegisterInput, StorageAdapter, StoredUser, UserPayload, UserProfile } from './types.ts';
