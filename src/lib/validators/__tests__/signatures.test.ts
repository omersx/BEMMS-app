import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {},
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

import {
  signaturePolicySchema,
  createSignaturePolicySchema,
  signActionSchema,
  signatureRequirementSchema,
} from '../signatures';
import { getAttestationText } from '@/lib/utils/attestations';

describe('Signature Validators', () => {
  describe('signatureRequirementSchema', () => {
    it('validates a correct signature requirement', () => {
      const valid = {
        purpose: 'perform',
        allowedRoles: ['BME_TECHNICIAN', 'BME_ENGINEER'],
        required: true,
      };
      const result = signatureRequirementSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an empty allowedRoles array', () => {
      const invalid = {
        purpose: 'perform',
        allowedRoles: [],
        required: true,
      };
      const result = signatureRequirementSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects an invalid purpose', () => {
      const invalid = {
        purpose: 'invalid_purpose',
        allowedRoles: ['BME_ENGINEER'],
        required: true,
      };
      const result = signatureRequirementSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('createSignaturePolicySchema', () => {
    it('validates a complete signature policy input', () => {
      const valid = {
        actionType: 'complete_corrective',
        criticalityLevel: 'high',
        requiredSignatures: [
          { purpose: 'perform', allowedRoles: ['BME_TECHNICIAN'], required: true },
          { purpose: 'review', allowedRoles: ['BME_ENGINEER', 'BME_MANAGER'], required: true },
        ],
        requireIndependentReview: true,
        performerCanRelease: false,
        requireReauth: true,
      };
      const result = createSignaturePolicySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('applies defaults for optional flags', () => {
      const minimal = {
        actionType: 'complete_pm',
        requiredSignatures: [
          { purpose: 'perform', allowedRoles: ['BME_ENGINEER'], required: true },
        ],
      };
      const parsed = createSignaturePolicySchema.parse(minimal);
      expect(parsed.requireIndependentReview).toBe(false);
      expect(parsed.performerCanRelease).toBe(true);
      expect(parsed.requireReauth).toBe(true);
      expect(parsed.policyVersion).toBe('1.0');
    });

    it('rejects an invalid actionType', () => {
      const invalid = {
        actionType: 'non_existent_action',
        requiredSignatures: [
          { purpose: 'perform', allowedRoles: ['BME_ENGINEER'], required: true },
        ],
      };
      const result = createSignaturePolicySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('signActionSchema', () => {
    it('validates a valid sign action payload with password and comments', () => {
      const valid = {
        signaturePurpose: 'perform',
        password: 'SecurePassword123!',
        comments: 'Checklist completed with no anomalies.',
      };
      const result = signActionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an empty password', () => {
      const invalid = {
        signaturePurpose: 'perform',
        password: '',
      };
      const result = signActionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password is required');
      }
    });

    it('accepts all standard signature purposes', () => {
      const purposes = [
        'accept', 'perform', 'review', 'approve',
        'release', 'resolve', 'close', 'reject',
        'amend', 'void',
      ];
      for (const purpose of purposes) {
        const result = signActionSchema.safeParse({
          signaturePurpose: purpose,
          password: 'secret',
        });
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('getAttestationText', () => {
  it('returns specific attestation text for known purposes', () => {
    expect(getAttestationText('perform')).toContain('performed the recorded maintenance');
    expect(getAttestationText('review')).toContain('reviewed the performed work');
    expect(getAttestationText('release')).toContain('authorize the release of this medical device');
    expect(getAttestationText('approve')).toContain('approve the recorded work');
    expect(getAttestationText('reject')).toContain('returning this work for correction');
  });

  it('returns fallback attestation for unknown purpose', () => {
    const text = getAttestationText('custom_action');
    expect(text).toContain('I confirm this custom_action action');
  });
});
