import { createHash } from 'crypto';

/**
 * Build a canonical JSON snapshot for cryptographic hashing.
 * Keys are sorted deterministically to ensure the same content
 * always produces the same hash regardless of insertion order.
 */
export function buildCanonicalSnapshot(data: Record<string, unknown>): string {
  return JSON.stringify(data, Object.keys(data).sort(), 0);
}

/**
 * Compute SHA-256 hash of a canonical JSON snapshot string.
 */
export function computeSHA256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}
