import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHasher, TokenGenerator } from '../application/ports';

const scryptAsync = promisify(scrypt);
const SCRYPT_KEYLEN = 64;
const SCRYPT_SCHEME = 'scrypt';

/**
 * Interim password hasher using Node's built-in **scrypt** — an adaptive, memory-hard KDF (no third-party
 * dependency). Stored format is `scrypt$<saltHex>$<hashHex>`; verification is constant-time. Better Auth owns
 * password hashing in production; this satisfies the same {@link PasswordHasher} port until then.
 */
@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scryptAsync(plain, salt, SCRYPT_KEYLEN)) as Buffer;
    return `${SCRYPT_SCHEME}$${salt}$${derived.toString('hex')}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [scheme, salt, hashHex] = stored.split('$');
    if (scheme !== SCRYPT_SCHEME || !salt || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const derived = (await scryptAsync(plain, salt, expected.length)) as Buffer;
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  }
}

/**
 * Opaque token generator for sessions + invitations. Returns 256 bits of entropy as a URL-safe token and its
 * SHA-256 hash — only the hash is ever persisted, so a database leak cannot be replayed.
 */
@Injectable()
export class CryptoTokenGenerator implements TokenGenerator {
  generate(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
