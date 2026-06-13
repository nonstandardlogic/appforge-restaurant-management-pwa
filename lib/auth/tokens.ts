import { randomBytes } from 'crypto';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface ResetToken {
  token: string;
  expiresAt: Date;
}

export function generateResetToken(): ResetToken {
  return {
    token: randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
  };
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
