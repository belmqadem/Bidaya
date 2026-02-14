/**
 * Unique child identifier generator.
 *
 * Format: CHR-XXXX-XXXX (8 alphanumeric chars, grouped for readability)
 *
 * Properties:
 *   - Human-readable: uppercase letters + digits, no ambiguous chars (0/O, 1/I/L)
 *   - Short: 8 chars → 2.8 billion combinations
 *   - Non-sequential: cryptographically random
 *   - Unique: collision check via DB before use
 */

import { randomBytes } from "crypto";

/** Characters that are easy to read aloud and won't be confused. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 30 chars, no 0O1IL

/**
 * Generate a random identifier string of `length` chars from ALPHABET.
 * Uses crypto.randomBytes for non-sequential output.
 */
function randomId(length: number): string {
  const bytes = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}

/**
 * Generate a child identifier in the format CHR-XXXX-XXXX.
 * Call `ensureUniqueChildId` to check uniqueness against the database.
 */
export function generateChildId(): string {
  const raw = randomId(8);
  return `CHR-${raw.slice(0, 4)}-${raw.slice(4)}`;
}
