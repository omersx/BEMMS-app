import { z } from 'zod';

export const localizationSettingsSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required').default('UTC'),
  dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).default('YYYY-MM-DD'),
  timeFormat: z.enum(['24h', '12h']).default('24h'),
  language: z.enum(['en', 'ar']).default('en'),
});

export const securitySettingsSchema = z.object({
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(1440).default(30),
  passwordExpiryDays: z.coerce.number().int().min(0).max(365).default(90),
  requireReAuthForSignatures: z.boolean().default(true),
  maxLoginAttempts: z.coerce.number().int().min(3).max(10).default(5),
});

export const retentionSettingsSchema = z.object({
  auditLogRetentionDays: z.coerce.number().int().min(30).max(3650).default(365), // 1 year default
  pmAlertWindowDays: z.coerce.number().int().min(1).max(90).default(14), // 14 days lead time
  attachmentQuotaMb: z.coerce.number().int().min(100).max(100000).default(5000), // 5GB
});

export const systemSettingsSchema = z.object({
  localization: localizationSettingsSchema.default({
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    language: 'en',
  }),
  security: securitySettingsSchema.default({
    sessionTimeoutMinutes: 30,
    passwordExpiryDays: 90,
    requireReAuthForSignatures: true,
    maxLoginAttempts: 5,
  }),
  retention: retentionSettingsSchema.default({
    auditLogRetentionDays: 365,
    pmAlertWindowDays: 14,
    attachmentQuotaMb: 5000,
  }),
});

export type SystemSettings = z.infer<typeof systemSettingsSchema>;
export type LocalizationSettings = z.infer<typeof localizationSettingsSchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type RetentionSettings = z.infer<typeof retentionSettingsSchema>;
