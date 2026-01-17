import { nanoid } from 'nanoid';

const SHORT_ID_LENGTH = 7;

/**
 * Generate a unique short identifier for a URL.
 * Uses nanoid with a URL-friendly alphabet.
 */
export function generateShortId(): string {
  return nanoid(SHORT_ID_LENGTH);
}
