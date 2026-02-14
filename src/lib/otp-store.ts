/**
 * In-memory OTP store for MVP.
 * NOT production-safe — restarts clear all OTPs.
 * Replace with Redis/DB for production.
 */

type OtpEntry = {
  code: string;
  childIdentifier: string;
  phone: string;
  expiresAt: number;
};

const store = new Map<string, OtpEntry>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Generate a 6-digit OTP. */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Key = childIdentifier:phone */
function key(childIdentifier: string, phone: string): string {
  return `${childIdentifier.toUpperCase()}:${phone}`;
}

/** Create an OTP and return the code. */
export function createOtp(childIdentifier: string, phone: string): string {
  const code = generateCode();
  store.set(key(childIdentifier, phone), {
    code,
    childIdentifier: childIdentifier.toUpperCase(),
    phone,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
  return code;
}

/** Verify an OTP. Returns true and removes entry on success. */
export function verifyOtp(
  childIdentifier: string,
  phone: string,
  code: string,
): boolean {
  const k = key(childIdentifier, phone);
  const entry = store.get(k);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(k);
    return false;
  }
  if (entry.code !== code) return false;
  store.delete(k);
  return true;
}
