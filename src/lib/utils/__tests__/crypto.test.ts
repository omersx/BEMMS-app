import { describe, it, expect } from 'vitest';
import { buildCanonicalSnapshot, computeSHA256 } from '../crypto';

describe('buildCanonicalSnapshot', () => {
  it('sorts keys deterministically regardless of input key order', () => {
    const objA = { z: 1, a: 2, m: 3 };
    const objB = { a: 2, m: 3, z: 1 };

    const snapshotA = buildCanonicalSnapshot(objA);
    const snapshotB = buildCanonicalSnapshot(objB);

    expect(snapshotA).toBe(snapshotB);
    expect(snapshotA).toBe('{"a":2,"m":3,"z":1}');
  });
});

describe('computeSHA256', () => {
  it('computes a 64-character hex hash', () => {
    const hash = computeSHA256('hello world');
    expect(hash).toHaveLength(64);
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('produces identical hashes for identical canonical snapshots', () => {
    const hash1 = computeSHA256(buildCanonicalSnapshot({ id: '1', title: 'Test' }));
    const hash2 = computeSHA256(buildCanonicalSnapshot({ title: 'Test', id: '1' }));
    expect(hash1).toBe(hash2);
  });
});
