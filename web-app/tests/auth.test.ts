import { beforeEach, expect, test } from 'vitest';
import { createAuthService, InvalidCredentialsError, LocalStorageAdapter, NoActiveSessionError, UserAlreadyExistsError, ValidationError, VaultLockedError } from '../src/auth/index.ts';
import { sha256 } from '../src/auth/crypto.service.ts';

class MemoryLocalStorage {
  private values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  dump(): string { return [...this.values.values()].join('\n'); }
}

const local = new MemoryLocalStorage();
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });

type Data = { cart: string[]; preferences: { theme: string } };
const makeAuth = () => createAuthService<Data>({
  initialData: () => ({ cart: [], preferences: { theme: 'light' } }),
  pbkdf2Iterations: 1_000, // Keep unit tests fast; production default is 310,000.
});
const input = {
  fullName: '  Example User  ',
  email: '  USER@Example.COM  ',
  password: 'secret123',
  passwordConfirmation: 'secret123',
};

beforeEach(() => local.clear());

test('register normalizes email, encrypts identity and data, and never persists password', async () => {
  const auth = makeAuth();
  await auth.register(input);
  const id = await sha256('user@example.com');
  const raw = local.getItem(`user:${id}`);
  expect(raw).not.toBeNull();
  expect(local.length).toBe(1);
  expect(raw).not.toContain('secret123');
  expect(raw).not.toContain('Example User');
  expect(raw).not.toContain('user@example.com');
  expect(raw).not.toContain('light');
  const stored = JSON.parse(raw ?? '{}');
  expect(stored.id).toBe(id);
  expect(typeof stored.encryptedData).toBe('string');
  await auth.login({ email: ' USER@example.com ', password: input.password });
  expect(await auth.getCurrentUser()).toEqual({ fullName: 'Example User', email: 'user@example.com' });
  expect(await auth.getUserData()).toEqual({ cart: [], preferences: { theme: 'light' } });
});

test('registration rejects duplicates, invalid confirmation, and weak inputs', async () => {
  const auth = makeAuth();
  await auth.register(input);
  await expect(auth.register({ ...input, email: 'user@example.com' })).rejects.toThrow(UserAlreadyExistsError);
  await expect(auth.register({ ...input, passwordConfirmation: 'wrong' })).rejects.toThrow(ValidationError);
  await expect(auth.register({ ...input, email: 'bad-email' })).rejects.toThrow(ValidationError);
  await expect(auth.register({ ...input, fullName: '  ' })).rejects.toThrow(ValidationError);
});

test('login uses one error for missing user and incorrect password', async () => {
  const auth = makeAuth();
  await auth.register(input);
  const missingUser = auth.login({ email: 'missing@example.com', password: 'secret123' });
  await expect(missingUser).rejects.toThrow(InvalidCredentialsError);
  await expect(missingUser).rejects.toHaveProperty('message', 'Invalid credentials');
  const wrongPassword = auth.login({ email: input.email, password: 'incorrect' });
  await expect(wrongPassword).rejects.toThrow(InvalidCredentialsError);
  await expect(wrongPassword).rejects.toHaveProperty('message', 'Invalid credentials');
  expect(auth.getSession()).toBeNull();
});

test('session survives service recreation while vault needs explicit unlock', async () => {
  const auth = makeAuth();
  await auth.register(input);
  const session = await auth.login({ email: input.email, password: input.password });
  expect(session.sessionId).toBeTruthy();
  expect(auth.isAuthenticated()).toBe(true);
  const restored = makeAuth();
  expect(restored.getSession()).toEqual(session);
  expect(restored.hasUnlockedVault()).toBe(false);
  await expect(restored.getUserData()).rejects.toThrow(VaultLockedError);
  await expect(restored.unlock('incorrect')).rejects.toThrow(InvalidCredentialsError);
  await restored.unlock(input.password);
  expect(await restored.getUserData()).toEqual({ cart: [], preferences: { theme: 'light' } });
});

test('generic updates persist, use a fresh IV, and support adding, editing, deleting', async () => {
  const auth = makeAuth();
  await auth.register(input);
  await auth.login({ email: input.email, password: input.password });
  const id = await sha256('user@example.com');
  const storage = new LocalStorageAdapter();
  const first = storage.get<{ iv: string }>(`user:${id}`);
  await auth.updateUserData((current) => ({ ...current, cart: [...current.cart, 'item-1'] }));
  const second = storage.get<{ iv: string }>(`user:${id}`);
  expect(first?.iv).not.toBe(second?.iv);
  await auth.updateUserData((current) => ({ ...current, preferences: { theme: 'dark' } }));
  await auth.updateUserData((current) => ({ ...current, cart: current.cart.filter((item) => item !== 'item-1') }));
  await auth.updateFullName('New Name');
  expect(await auth.getUserData()).toEqual({ cart: [], preferences: { theme: 'dark' } });
  expect((await auth.getCurrentUser()).fullName).toBe('New Name');
  expect(local.dump()).not.toContain('dark');
  const recreated = makeAuth();
  await recreated.unlock(input.password);
  expect((await recreated.getUserData()).preferences.theme).toBe('dark');
});

test('payload update rejects email changes because the email is the storage index', async () => {
  const auth = makeAuth();
  await auth.register(input);
  await auth.login({ email: input.email, password: input.password });
  await expect(auth.updateUserPayload((current) => ({
    ...current, profile: { ...current.profile, email: 'other@example.com' },
  }))).rejects.toThrow(ValidationError);
});

test('logout clears session and in-memory key without deleting encrypted user', async () => {
  const auth = makeAuth();
  await auth.register(input);
  await auth.login({ email: input.email, password: input.password });
  auth.logout();
  expect(auth.getSession()).toBeNull();
  expect(auth.hasUnlockedVault()).toBe(false);
  expect(local.length).toBe(1);
  await expect(auth.getUserData()).rejects.toThrow(NoActiveSessionError);
});
