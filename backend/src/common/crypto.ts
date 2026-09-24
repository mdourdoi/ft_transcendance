import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ErrorCode } from './error-codes.js';

export function encryptSecret(plain: string): string {
  if (!process.env.TWOFA_ENCRYPTION_KEY) {
    throw new Error(ErrorCode.MISSING_TWOFA_ENCRYPTION_KEY);
  }

  const key = Buffer.from(process.env.TWOFA_ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const firstPart = cipher.update(plain, 'utf-8');
  const lastPart = cipher.final();
  const tag = cipher.getAuthTag();
  const encrypted = Buffer.concat([firstPart, lastPart]);
  return (
    iv.toString('hex') +
    '.' +
    tag.toString('hex') +
    '.' +
    encrypted.toString('hex')
  );
}

export function decryptSecret(stored: string): string {
  if (!process.env.TWOFA_ENCRYPTION_KEY) {
    throw new Error(ErrorCode.MISSING_TWOFA_ENCRYPTION_KEY);
  }

  const key = Buffer.from(process.env.TWOFA_ENCRYPTION_KEY, 'hex');
  const storedSplit = stored.split('.');
  if (storedSplit.length !== 3) {
    throw new Error(ErrorCode.INVALID_ENCRYPTED_VALUE);
  }
  const iv = Buffer.from(storedSplit[0], 'hex');
  const tag = Buffer.from(storedSplit[1], 'hex');
  const encrypted = Buffer.from(storedSplit[2], 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const firstPart = decipher.update(encrypted);
  const lastPart = decipher.final();
  const plain = Buffer.concat([firstPart, lastPart]);
  return plain.toString('utf8');
}
