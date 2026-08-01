/**
 * RFC 6238 TOTP with node crypto — no new dependency for a hundred lines of
 * arithmetic. SHA-1, 6 digits, 30s step, ±1 step of clock drift accepted
 * (the standard authenticator-app contract).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(secret: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of secret.replace(/=+$/, '').toUpperCase()) {
    const index = BASE32.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;
  return String(code % 1_000_000).padStart(6, '0');
}

export function totpCode(secret: string, at: Date = new Date()): string {
  return hotp(secret, Math.floor(at.getTime() / 1000 / 30));
}

export function verifyTotp(secret: string, code: string, at: Date = new Date()): boolean {
  const cleaned = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  const counter = Math.floor(at.getTime() / 1000 / 30);
  for (const drift of [-1, 0, 1]) {
    const expected = hotp(secret, counter + drift);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(cleaned))) return true;
  }
  return false;
}

/** The otpauth:// URI an authenticator app enrolls from. */
export function totpUri(secret: string, accountEmail: string): string {
  return `otpauth://totp/ClueCrew:${encodeURIComponent(accountEmail)}?secret=${secret}&issuer=ClueCrew&digits=6&period=30`;
}
