import type { StoredUser, UserPayload } from './types.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

/** Normalizes an email address for the lookup index.
 * @param email Email entered by the user.
 * @returns The trimmed, lowercase email address.
 * @example normalizeEmail('  ANA@EXAMPLE.COM  '); // 'ana@example.com'
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Encodes bytes as text for storage.
 * @param bytes Binary bytes.
 * @returns A Base64 string.
 * @example toBase64(new Uint8Array([65])); // 'QQ=='
 */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Decodes a Base64 string.
 * @param base64 Valid Base64 string.
 * @returns The original bytes.
 * @example fromBase64('QQ=='); // Uint8Array([65])
 */
export function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Converts a Web Crypto result to Base64 text.
 * @param buffer Binary buffer.
 * @returns A Base64 string.
 * @example arrayBufferToBase64(new Uint8Array([65]).buffer); // 'QQ=='
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return toBase64(new Uint8Array(buffer));
}

/** Calculates a hexadecimal SHA-256 hash for indexing, not secrecy.
 * @param value Text to hash.
 * @returns A 64-character hexadecimal hash.
 * @example const id = await sha256(normalizeEmail('ana@example.com'));
 */
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Creates a random salt for PBKDF2.
 * @returns 16 new bytes.
 * @example const salt = randomSalt();
 */
export function randomSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(16));
}

/** Creates a fresh IV for an AES-GCM operation.
 * @returns 12 new bytes; do not reuse them with the same key.
 * @example const iv = randomIv();
 */
export function randomIv(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(12));
}

/** Derives a non-exportable AES-256 key using PBKDF2 and SHA-256.
 * @param password In-memory password; never persisted.
 * @param salt The user's random salt.
 * @param iterations PBKDF2 iteration count stored with the record.
 * @returns A `CryptoKey` for encryption and decryption.
 * @example const key = await deriveKey('secret123', randomSalt(), 310_000);
 */
export async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Binds record metadata to the authenticated ciphertext.
 * @param record The user's version, ID, and iteration count.
 * @returns Bytes used as AES-GCM additional authenticated data.
 * @example const aad = associatedData({ version: 1, id, iterations });
 */
function associatedData(record: Pick<StoredUser, 'version' | 'id' | 'iterations'>): Uint8Array<ArrayBuffer> {
  return encoder.encode(`${record.version}:${record.id}:${record.iterations}`);
}

/** Serializes and encrypts the entire payload with a fresh IV.
 * @typeParam TData Shape of the application data.
 * @param payload Profile and data to store.
 * @param key AES key derived from the password.
 * @param record Metadata and salt stored with the ciphertext.
 * @returns A complete record with Base64 IV and ciphertext.
 * @example const stored = await encryptPayload(payload, key, { version: 1, id, iterations, salt });
 */
export async function encryptPayload<TData>(
  payload: UserPayload<TData>, key: CryptoKey, record: Pick<StoredUser, 'version' | 'id' | 'iterations' | 'salt'>,
): Promise<StoredUser> {
  const iv = randomIv();
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: associatedData(record) }, key, plaintext,
  );
  return { ...record, iv: toBase64(iv), encryptedData: arrayBufferToBase64(ciphertext) };
}

/** Decrypts and deserializes a user record.
 * @typeParam TData Expected shape of the application data.
 * @param record Stored encrypted record.
 * @param key AES key derived from the correct password.
 * @returns Decrypted profile and application data.
 * @example const payload = await decryptPayload<AppData>(record, key);
 */
export async function decryptPayload<TData>(record: StoredUser, key: CryptoKey): Promise<UserPayload<TData>> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(record.iv), additionalData: associatedData(record) },
    key,
    new Uint8Array(fromBase64(record.encryptedData)),
  );
  return JSON.parse(decoder.decode(plaintext)) as UserPayload<TData>;
}
