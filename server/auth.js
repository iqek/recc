import crypto from 'node:crypto';

const KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, KEYLEN);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate);
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}
