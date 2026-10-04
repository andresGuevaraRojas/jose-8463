export class AuthError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = new.target.name;
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) { super(message, 'VALIDATION'); }
}

export class InvalidCredentialsError extends AuthError {
  constructor() { super('Invalid credentials', 'INVALID_CREDENTIALS'); }
}

export class UserAlreadyExistsError extends AuthError {
  constructor() { super('User already exists', 'USER_ALREADY_EXISTS'); }
}

export class NoActiveSessionError extends AuthError {
  constructor() { super('No active session', 'NO_ACTIVE_SESSION'); }
}

export class VaultLockedError extends AuthError {
  constructor() { super('Vault is locked; call unlock(password)', 'VAULT_LOCKED'); }
}

export class StorageError extends AuthError {
  constructor(message: string) { super(message, 'STORAGE'); }
}
