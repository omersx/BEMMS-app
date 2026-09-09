import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { query: {} },
}));

import { hasRole } from '../rbac';

describe('hasRole', () => {
  it('returns true when user has the specified role', () => {
    const userRoles = ['BIOMED_ENG', 'STAFF'];
    expect(hasRole(userRoles, 'BIOMED_ENG')).toBe(true);
  });

  it('returns true when user has at least one of multiple requested roles', () => {
    const userRoles = ['BIOMED_TECH'];
    expect(hasRole(userRoles, 'BIOMED_ENG', 'BIOMED_TECH', 'SYS_ADMIN')).toBe(true);
  });

  it('returns false when user does not have the specified role', () => {
    const userRoles = ['STAFF'];
    expect(hasRole(userRoles, 'SYS_ADMIN', 'ORG_ADMIN')).toBe(false);
  });

  it('returns false for empty user roles', () => {
    expect(hasRole([], 'SYS_ADMIN')).toBe(false);
  });
});
