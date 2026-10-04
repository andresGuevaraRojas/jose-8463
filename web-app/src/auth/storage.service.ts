import { StorageError } from './errors.ts';
import type { StorageAdapter } from './types.ts';

export class LocalStorageAdapter implements StorageAdapter {
  /** Reads JSON from `localStorage`.
   * @typeParam T Expected type after deserialization.
   * @param key Storage key.
   * @returns The value, or `null` if the key does not exist.
   * @example const session = storage.get<AuthSession>('auth:session');
   */
  get<T>(key: string): T | null {
    try {
      const raw = globalThis.localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw) as T;
    } catch {
      throw new StorageError(`Unable to read storage key: ${key}`);
    }
  }

  /** Serializes and saves a value in `localStorage`.
   * @typeParam T Type of the serializable value.
   * @param key Storage key.
   * @param value Value to save.
   * @returns Nothing.
   * @example storage.set('settings', { theme: 'dark' });
   */
  set<T>(key: string, value: T): void {
    try {
      globalThis.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new StorageError(`Unable to write storage key: ${key}`);
    }
  }

  /** Removes a key from `localStorage`.
   * @param key Key to remove.
   * @returns Nothing.
   * @example storage.remove('auth:session');
   */
  remove(key: string): void {
    try {
      globalThis.localStorage.removeItem(key);
    } catch {
      throw new StorageError(`Unable to remove storage key: ${key}`);
    }
  }

  /** Checks whether a key exists in `localStorage`.
   * @param key Key to check.
   * @returns `true` if it exists.
   * @example const exists = storage.has('auth:session');
   */
  has(key: string): boolean {
    try {
      return globalThis.localStorage.getItem(key) !== null;
    } catch {
      throw new StorageError(`Unable to read storage key: ${key}`);
    }
  }
}
