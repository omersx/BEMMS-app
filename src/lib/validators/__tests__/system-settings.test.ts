import { describe, it, expect } from 'vitest';
import {
  localizationSettingsSchema,
  securitySettingsSchema,
  retentionSettingsSchema,
  systemSettingsSchema,
} from '../system-settings';

describe('localizationSettingsSchema', () => {
  it('accepts valid localization settings', () => {
    const result = localizationSettingsSchema.safeParse({
      timezone: 'Africa/Cairo',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      language: 'en',
    });
    expect(result.success).toBe(true);
  });

  it('accepts Arabic language setting per Section 14.1', () => {
    const result = localizationSettingsSchema.safeParse({
      timezone: 'Asia/Riyadh',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      language: 'ar',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsupported language', () => {
    const result = localizationSettingsSchema.safeParse({
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      language: 'es',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = localizationSettingsSchema.safeParse({
      timezone: 'UTC',
      dateFormat: 'DD-MM-YYYY', // unsupported delimiter
      timeFormat: '24h',
      language: 'en',
    });
    expect(result.success).toBe(false);
  });
});

describe('securitySettingsSchema', () => {
  it('accepts standard 21 CFR Part 11 security settings', () => {
    const result = securitySettingsSchema.safeParse({
      sessionTimeoutMinutes: 15,
      passwordExpiryDays: 90,
      requireReAuthForSignatures: true,
      maxLoginAttempts: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects timeout below minimum threshold', () => {
    const result = securitySettingsSchema.safeParse({
      sessionTimeoutMinutes: 2, // min is 5
      passwordExpiryDays: 90,
      requireReAuthForSignatures: true,
      maxLoginAttempts: 5,
    });
    expect(result.success).toBe(false);
  });

  it('coerces string inputs to numbers gracefully', () => {
    const result = securitySettingsSchema.safeParse({
      sessionTimeoutMinutes: '30',
      passwordExpiryDays: '60',
      requireReAuthForSignatures: false,
      maxLoginAttempts: '3',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionTimeoutMinutes).toBe(30);
      expect(result.data.passwordExpiryDays).toBe(60);
      expect(result.data.maxLoginAttempts).toBe(3);
    }
  });
});

describe('retentionSettingsSchema', () => {
  it('accepts valid retention policies', () => {
    const result = retentionSettingsSchema.safeParse({
      auditLogRetentionDays: 365,
      pmAlertWindowDays: 14,
      attachmentQuotaMb: 10000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects audit log retention less than 30 days', () => {
    const result = retentionSettingsSchema.safeParse({
      auditLogRetentionDays: 10,
      pmAlertWindowDays: 14,
      attachmentQuotaMb: 5000,
    });
    expect(result.success).toBe(false);
  });
});

describe('systemSettingsSchema', () => {
  it('provides complete defaults when given empty object', () => {
    const result = systemSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.localization.timezone).toBe('UTC');
      expect(result.data.security.requireReAuthForSignatures).toBe(true);
      expect(result.data.retention.pmAlertWindowDays).toBe(14);
    }
  });
});
