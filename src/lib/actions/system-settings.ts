'use server';

import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import {
  systemSettingsSchema,
  localizationSettingsSchema,
  securitySettingsSchema,
  retentionSettingsSchema,
  type SystemSettings,
} from '@/lib/validators/system-settings';
import { eq, sql } from 'drizzle-orm';

const defaultSettings: SystemSettings = {
  localization: {
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    language: 'en',
  },
  security: {
    sessionTimeoutMinutes: 30,
    passwordExpiryDays: 90,
    requireReAuthForSignatures: true,
    maxLoginAttempts: 5,
  },
  retention: {
    auditLogRetentionDays: 365,
    pmAlertWindowDays: 14,
    attachmentQuotaMb: 5000,
  },
};

// Ensure settings column exists in the database safely
async function ensureSettingsColumn() {
  try {
    await db.execute(sql`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings jsonb;`);
  } catch {
    // Ignore if column or table already up to date
  }
}

export type GetSettingsResult =
  | { success: true; data: SystemSettings; organizationId: string; organizationName?: string }
  | { success: false; error: string; data?: undefined; organizationId?: undefined; organizationName?: undefined };

export async function getOrganizationSettings(orgId?: string): Promise<GetSettingsResult> {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  await ensureSettingsColumn();

  const targetOrgId = orgId || session.organizationId;
  if (!targetOrgId) {
    // Fallback to first available organization if session has none
    const firstOrg = await db.query.organizations.findFirst();
    if (!firstOrg) {
      return { success: false, error: 'No organization found. Please register an organization first.' };
    }
    const parsed = systemSettingsSchema.safeParse(firstOrg.settings || {});
    return {
      success: true,
      data: parsed.success ? parsed.data : defaultSettings,
      organizationId: firstOrg.id,
      organizationName: firstOrg.name,
    };
  }

  try {
    let org = await db.query.organizations.findFirst({
      where: eq(organizations.id, targetOrgId),
    });

    if (!org) {
      // Fallback to first available organization if targetOrgId is invalid or unseeded
      org = await db.query.organizations.findFirst();
    }

    if (!org) {
      return { success: false, error: 'No organization found. Please register an organization in General settings.' };
    }

    const parsed = systemSettingsSchema.safeParse(org.settings || {});
    const effectiveSettings = parsed.success ? parsed.data : defaultSettings;

    // Synchronize defaultTimezone if org has it set
    if (org.defaultTimezone && !org.settings) {
      effectiveSettings.localization.timezone = org.defaultTimezone;
    }

    return {
      success: true,
      data: effectiveSettings,
      organizationId: org.id,
      organizationName: org.name,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export type UpdateSettingsResult =
  | { success: true; data: SystemSettings }
  | { success: false; error: string };

export async function updateOrganizationSettings(params: {
  organizationId?: string;
  section: 'localization' | 'security' | 'retention';
  settings: unknown;
  changeReason?: string;
}): Promise<UpdateSettingsResult> {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  await ensureSettingsColumn();

  const { organizationId, section, settings: newSectionData, changeReason } = params;
  const targetOrgId = organizationId || session.organizationId;

  if (!targetOrgId) {
    return { success: false, error: 'No organization specified' };
  }

  // Validate the incoming section payload
  let validatedSection: unknown;
  if (section === 'localization') {
    const res = localizationSettingsSchema.safeParse(newSectionData);
    if (!res.success) return { success: false, error: res.error.message };
    validatedSection = res.data;
  } else if (section === 'security') {
    const res = securitySettingsSchema.safeParse(newSectionData);
    if (!res.success) return { success: false, error: res.error.message };
    validatedSection = res.data;
  } else if (section === 'retention') {
    const res = retentionSettingsSchema.safeParse(newSectionData);
    if (!res.success) return { success: false, error: res.error.message };
    validatedSection = res.data;
  } else {
    return { success: false, error: 'Invalid settings section' };
  }

  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, targetOrgId),
    });

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    const currentParsed = systemSettingsSchema.safeParse(org.settings || {});
    const currentSettings = currentParsed.success ? currentParsed.data : { ...defaultSettings };

    const previousSectionState = currentSettings[section];
    currentSettings[section] = validatedSection as any;

    return await db.transaction(async (tx) => {
      const updatePayload: Record<string, any> = {
        settings: currentSettings,
        updatedAt: new Date(),
        updatedByUserId: session.id,
      };

      // Also keep defaultTimezone in sync if localization was modified
      if (section === 'localization' && (validatedSection as any).timezone) {
        updatePayload.defaultTimezone = (validatedSection as any).timezone;
      }

      await tx.update(organizations).set(updatePayload).where(eq(organizations.id, targetOrgId));

      await createAuditLog(tx, {
        action: 'UPDATE_SETTINGS',
        entityType: 'organization',
        entityId: targetOrgId,
        actorUserId: session.id,
        organizationId: targetOrgId,
        previousState: { [section]: previousSectionState },
        newState: { [section]: validatedSection },
        changeReason: changeReason || `Updated system settings (${section})`,
      });

      return {
        success: true,
        data: currentSettings,
      };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  databaseStatus: 'connected' | 'error';
  databasePingMs: number;
  environment: string;
  uptimeSeconds: number;
  serverTime: string;
  memoryUsage: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  runtime: {
    nodeVersion: string;
    platform: string;
    arch: string;
  };
}

export async function getSystemHealth(): Promise<{ success: boolean; data?: SystemHealthData; error?: string }> {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  try {
    const startTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const pingMs = Date.now() - startTime;

    const mem = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    const healthData: SystemHealthData = {
      status: pingMs < 500 ? 'healthy' : 'degraded',
      databaseStatus: 'connected',
      databasePingMs: pingMs,
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds,
      serverTime: new Date().toISOString(),
      memoryUsage: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    return { success: true, data: healthData };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: {
        status: 'unhealthy',
        databaseStatus: 'error',
        databasePingMs: -1,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(process.uptime()),
        serverTime: new Date().toISOString(),
        memoryUsage: { rssMb: 0, heapUsedMb: 0, heapTotalMb: 0 },
        runtime: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
    };
  }
}
