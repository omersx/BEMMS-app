'use server';

import { db } from '@/lib/db';
import { deviceQrLabels, devices } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

function generateOpaqueReference(): string {
  return `dv_${nanoid(10)}`;
}

export async function getActiveQrLabel(deviceId: string) {
  await requireAuth();
  try {
    const data = await db.query.deviceQrLabels.findFirst({
      where: and(
        eq(deviceQrLabels.deviceId, deviceId),
        eq(deviceQrLabels.labelStatus, 'active'),
      ),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateNewQrLabel(deviceId: string, reason?: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');

  try {
    const device = await db.query.devices.findFirst({ where: eq(devices.id, deviceId) });
    if (!device) return { success: false, error: 'Device not found' };

    return await db.transaction(async (tx) => {
      // Revoke existing active label
      const existing = await tx.query.deviceQrLabels.findFirst({
        where: and(
          eq(deviceQrLabels.deviceId, deviceId),
          eq(deviceQrLabels.labelStatus, 'active'),
        ),
      });

      const newRef = generateOpaqueReference();

      if (existing) {
        await tx.update(deviceQrLabels)
          .set({
            labelStatus: 'replaced',
            revokedAt: new Date(),
            revokedByUserId: session.id,
            revocationReason: reason || 'Replaced with new label',
          })
          .where(eq(deviceQrLabels.id, existing.id));
      }

      const [newLabel] = await tx.insert(deviceQrLabels).values({
        organizationId: device.organizationId,
        deviceId,
        opaqueReference: newRef,
        labelStatus: 'active',
        createdByUserId: session.id,
      }).returning();

      if (existing) {
        await tx.update(deviceQrLabels)
          .set({ replacedByQrId: newLabel.id })
          .where(eq(deviceQrLabels.id, existing.id));
      }

      await createAuditLog(tx, {
        action: 'CREATE', entityType: 'device_qr_label', entityId: newLabel.id,
        actorId: session.id,
        details: { deviceId, opaqueReference: newRef, replacedLabelId: existing?.id, reason },
      });

      return { success: true, data: newLabel };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recordQrPrint(qrLabelId: string) {
  const session = await requireAuth();
  try {
    const [updated] = await db.update(deviceQrLabels)
      .set({
        printCount: (await db.query.deviceQrLabels.findFirst({ where: eq(deviceQrLabels.id, qrLabelId) }))!.printCount! + 1,
        printedAt: new Date(),
        printedByUserId: session.id,
      })
      .where(eq(deviceQrLabels.id, qrLabelId))
      .returning();
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveDeviceScan(opaqueReference: string) {
  try {
    const qrLabel = await db.query.deviceQrLabels.findFirst({
      where: eq(deviceQrLabels.opaqueReference, opaqueReference),
      with: { device: true },
    });

    if (!qrLabel) {
      return { success: false, error: 'QR code not found', code: 'NOT_FOUND' };
    }
    if (qrLabel.labelStatus !== 'active') {
      return { success: false, error: 'This QR label has been revoked or replaced', code: 'INACTIVE' };
    }
    if (!qrLabel.device) {
      return { success: false, error: 'Device not found', code: 'DEVICE_NOT_FOUND' };
    }

    return {
      success: true,
      data: {
        deviceId: qrLabel.device.id,
        deviceName: qrLabel.device.name,
        assetNumber: qrLabel.device.assetNumber,
        currentStatus: qrLabel.device.currentStatusCode,
        organizationId: qrLabel.device.organizationId,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
