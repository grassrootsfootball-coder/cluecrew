import { describe, expect, it } from 'vitest';
import { generateTotpSecret, totpCode, totpUri, verifyTotp } from './totp';

describe('TOTP (RFC 6238, the invite flow second factor)', () => {
  it('matches the RFC 6238 SHA-1 test vector', () => {
    // RFC secret "12345678901234567890" is GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ
    // in base32; at t=59s the reference code is 287082 (8-digit 94287082).
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', new Date(59_000))).toBe('287082');
  });

  it('verifies within ±1 step of drift, and only there', () => {
    const secret = generateTotpSecret();
    const now = new Date('2026-08-01T12:00:00Z');
    const code = totpCode(secret, now);
    expect(verifyTotp(secret, code, now)).toBe(true);
    expect(verifyTotp(secret, code, new Date(now.getTime() + 29_000))).toBe(true);
    expect(verifyTotp(secret, code, new Date(now.getTime() + 95_000))).toBe(false);
    expect(verifyTotp(secret, '000000', now)).toBe(code === '000000');
    expect(verifyTotp(secret, 'nonsense', now)).toBe(false);
  });

  it('produces an enrollable otpauth URI', () => {
    const uri = totpUri('ABC234', 'reviewer@cluecrew.test');
    expect(uri).toContain('otpauth://totp/ClueCrew:');
    expect(uri).toContain('secret=ABC234');
    expect(uri).toContain('issuer=ClueCrew');
  });
});
