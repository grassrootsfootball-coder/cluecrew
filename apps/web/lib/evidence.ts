/**
 * Bursary evidence encryption (BUILD-PHASE-2 §6): AES-256-GCM at rest,
 * decrypted only for the admin reviewer, hard-deleted 30 days after decision.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function key(): Buffer {
  const configured = process.env.EVIDENCE_KEY;
  if (configured) {
    const parsed = Buffer.from(configured, 'base64');
    if (parsed.length === 32) return parsed;
    throw new Error('EVIDENCE_KEY must be 32 bytes, base64-encoded');
  }
  if (process.env.APP_ENV === 'production') {
    throw new Error('EVIDENCE_KEY is required in production');
  }
  // Dev fallback: derive from AUTH_SECRET so local flows work with no setup.
  return createHash('sha256').update(`evidence:${process.env.AUTH_SECRET ?? 'dev'}`).digest();
}

export function encryptEvidence(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

export function decryptEvidence(stored: Buffer): Buffer {
  const iv = stored.subarray(0, 12);
  const tag = stored.subarray(12, 28);
  const encrypted = stored.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
