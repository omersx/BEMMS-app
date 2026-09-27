'use server';

import { db } from '@/lib/db';
import {
  devices, deviceQrLabels, deviceStatusHistory,
  deviceLocationHistory, maintenanceTasks, maintenanceRecords,
  electronicSignatures, signatureEvents, deviceAttachments,
  deviceCategories, serviceTickets,
} from '@/lib/db/schema';
import { requireAuth, requireRole, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import {
  createDeviceSchema, updateDeviceSchema, transferDeviceSchema,
  changeDeviceStatusSchema, decommissionDeviceSchema,
} from '@/lib/validators/devices';
import { eq, desc, and, or, ilike, sql, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

function generateOpaqueReference(): string {
  return `dv_${nanoid(10)}`;
}

function generateInternalCode(): string {
  const year = new Date().getFullYear();
  const seq = nanoid(6).toUpperCase();
  return `DEV-${year}-${seq}`;
}

// ── List / Search ───────────────────────────────────────────────────────────────

export async function getDevices(filters?: {
  search?: string;
  organizationId?: string;
  hospitalId?: string;
  departmentId?: string;
  categoryId?: string;
  manufacturerId?: string;
  status?: string;
  criticality?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();
  try {
    const conditions: any[] = [];
    if (filters?.organizationId) conditions.push(eq(devices.organizationId, filters.organizationId));
    if (filters?.hospitalId) conditions.push(eq(devices.hospitalId, filters.hospitalId));
    if (filters?.departmentId) conditions.push(eq(devices.departmentId, filters.departmentId));
    if (filters?.categoryId) conditions.push(eq(devices.deviceCategoryId, filters.categoryId));
    if (filters?.manufacturerId) conditions.push(eq(devices.manufacturerId, filters.manufacturerId));
    if (filters?.status) conditions.push(eq(devices.currentStatusCode, filters.status as any));
    if (filters?.criticality) conditions.push(eq(devices.criticalityLevel, filters.criticality as any));
    if (filters?.search) {
      conditions.push(
        or(
          ilike(devices.name, `%${filters.search}%`),
          ilike(devices.assetNumber, `%${filters.search}%`),
          ilike(devices.serialNumber, `%${filters.search}%`),
          ilike(devices.internalCode, `%${filters.search}%`),
        )
      );
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.devices.findMany({
      where: whereClause,
      with: {
        deviceCategory: true,
        manufacturer: true,
        hospital: true,
        department: true,
        location: true,
        assignedEngineer: true,
      },
      orderBy: [desc(devices.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDeviceById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.devices.findFirst({
      where: eq(devices.id, id),
      with: {
        organization: true,
        hospital: true,
        department: true,
        location: true,
        deviceCategory: true,
        manufacturer: true,
        deviceModel: true,
        assignedEngineer: true,
      },
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Create ──────────────────────────────────────────────────────────────────────

export async function createDevice(input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  const validated = createDeviceSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireScope({
    organizationId: validated.data.organizationId,
    hospitalId: validated.data.hospitalId,
    departmentId: validated.data.departmentId,
  });

  try {
    return await db.transaction(async (tx) => {
      const internalCode = generateInternalCode();
      const opaqueReference = generateOpaqueReference();

      // Resolve category if not specified or empty
      let categoryId = validated.data.deviceCategoryId || undefined;
      let resolvedCriticality = validated.data.criticalityLevel;
      let resolvedRisk = validated.data.riskClassification;

      if (!categoryId) {
        const allCats = await tx.query.deviceCategories.findMany({
          where: eq(deviceCategories.organizationId, validated.data.organizationId),
        });
        const lowerName = validated.data.name.toLowerCase();
        const matched = allCats.find((c) =>
          lowerName.includes(c.name.toLowerCase()) ||
          lowerName.includes(c.code.toLowerCase()) ||
          c.name.toLowerCase().includes(lowerName)
        );
        if (matched) {
          categoryId = matched.id;
          resolvedCriticality = resolvedCriticality || matched.criticalityLevel || 'medium';
          resolvedRisk = resolvedRisk || matched.riskClassification || 'class_i';
        } else {
          const generalCat = allCats.find((c) => c.code === 'GENERAL');
          if (generalCat) {
            categoryId = generalCat.id;
            resolvedCriticality = resolvedCriticality || generalCat.criticalityLevel || 'medium';
            resolvedRisk = resolvedRisk || generalCat.riskClassification || 'class_i';
          } else if (allCats.length > 0) {
            categoryId = allCats[0].id;
            resolvedCriticality = resolvedCriticality || allCats[0].criticalityLevel || 'medium';
            resolvedRisk = resolvedRisk || allCats[0].riskClassification || 'class_i';
          } else {
            const [newCat] = await tx.insert(deviceCategories).values({
              organizationId: validated.data.organizationId,
              name: 'General Medical Equipment',
              code: 'GENERAL',
              riskClassification: 'class_i',
              criticalityLevel: 'medium',
              defaultPmIntervalDays: 365,
              createdByUserId: session.id,
            }).returning();
            categoryId = newCat.id;
            resolvedCriticality = resolvedCriticality || 'medium';
            resolvedRisk = resolvedRisk || 'class_i';
          }
        }
      }

      const [newDevice] = await tx.insert(devices).values({
        ...validated.data,
        deviceCategoryId: categoryId,
        criticalityLevel: resolvedCriticality,
        riskClassification: resolvedRisk,
        internalCode,
        currentStatusCode: 'operational',
        lifecycleStatus: 'active',
        statusChangedAt: new Date(),
        statusChangedByUserId: session.id,
        createdByUserId: session.id,
        updatedByUserId: session.id,
      }).returning();

      // Create active QR label
      await tx.insert(deviceQrLabels).values({
        organizationId: validated.data.organizationId,
        deviceId: newDevice.id,
        opaqueReference,
        labelStatus: 'active',
        createdByUserId: session.id,
      });

      // Initial status history
      await tx.insert(deviceStatusHistory).values({
        organizationId: validated.data.organizationId,
        deviceId: newDevice.id,
        previousStatusCode: null,
        newStatusCode: 'operational',
        reason: 'Device registered',
        changedByUserId: session.id,
      });

      // Initial location history
      await tx.insert(deviceLocationHistory).values({
        organizationId: validated.data.organizationId,
        deviceId: newDevice.id,
        newHospitalId: validated.data.hospitalId,
        newDepartmentId: validated.data.departmentId,
        newLocationId: validated.data.locationId || null,
        transferReason: 'relocation',
        notes: 'Initial device registration',
        changedByUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'CREATE', entityType: 'device', entityId: newDevice.id,
        actorId: session.id, details: { ...validated.data, internalCode, opaqueReference },
      });

      return { success: true, data: newDevice };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Update ──────────────────────────────────────────────────────────────────────

export async function updateDevice(id: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  const validated = updateDeviceSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const device = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!device) return { success: false, error: 'Device not found' };

    await requireScope({
      organizationId: device.organizationId,
      hospitalId: device.hospitalId,
      departmentId: device.departmentId,
    });

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(devices)
        .set({ ...validated.data, updatedByUserId: session.id, updatedAt: new Date() })
        .where(eq(devices.id, id))
        .returning();
      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'device', entityId: id,
        actorId: session.id, details: validated.data,
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Transfer Location ───────────────────────────────────────────────────────────

export async function transferDeviceLocation(id: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  const validated = transferDeviceSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const device = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!device) return { success: false, error: 'Device not found' };

    return await db.transaction(async (tx) => {
      // Record location history
      await tx.insert(deviceLocationHistory).values({
        organizationId: device.organizationId,
        deviceId: id,
        previousHospitalId: device.hospitalId,
        previousDepartmentId: device.departmentId,
        previousLocationId: device.locationId,
        newHospitalId: validated.data.destinationHospitalId,
        newDepartmentId: validated.data.destinationDepartmentId,
        newLocationId: validated.data.destinationLocationId || null,
        transferReason: validated.data.transferReason,
        notes: validated.data.notes,
        changedByUserId: session.id,
      });

      // Update device location
      const [updated] = await tx.update(devices).set({
        hospitalId: validated.data.destinationHospitalId,
        departmentId: validated.data.destinationDepartmentId,
        locationId: validated.data.destinationLocationId || null,
        updatedByUserId: session.id,
        updatedAt: new Date(),
      }).where(eq(devices.id, id)).returning();

      await createAuditLog(tx, {
        action: 'TRANSFER', entityType: 'device', entityId: id,
        actorId: session.id,
        details: {
          from: { hospitalId: device.hospitalId, departmentId: device.departmentId, locationId: device.locationId },
          to: validated.data,
        },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Change Status ───────────────────────────────────────────────────────────────

export async function changeDeviceStatus(id: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH');
  const validated = changeDeviceStatusSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const device = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!device) return { success: false, error: 'Device not found' };

    return await db.transaction(async (tx) => {
      // Record status history
      await tx.insert(deviceStatusHistory).values({
        organizationId: device.organizationId,
        deviceId: id,
        previousStatusCode: device.currentStatusCode,
        newStatusCode: validated.data.newStatusCode,
        reason: validated.data.reason,
        notes: validated.data.notes,
        changedByUserId: session.id,
        relatedTicketId: validated.data.ticketId,
        relatedMaintenanceRecordId: validated.data.maintenanceRecordId,
      });

      // Update device
      const statusUpdate: any = {
        currentStatusCode: validated.data.newStatusCode as any,
        statusChangedAt: new Date(),
        statusChangedByUserId: session.id,
        updatedByUserId: session.id,
        updatedAt: new Date(),
      };
      if (validated.data.limitationsNote) {
        statusUpdate.statusLimitationsNote = validated.data.limitationsNote;
      }
      if (validated.data.newStatusCode === 'operational') {
        statusUpdate.statusLimitationsNote = null;
      }

      const [updated] = await tx.update(devices)
        .set(statusUpdate)
        .where(eq(devices.id, id))
        .returning();

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'device', entityId: id,
        actorId: session.id,
        details: { previousStatus: device.currentStatusCode, ...validated.data },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Decommission ────────────────────────────────────────────────────────────────

export async function decommissionDevice(id: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR');
  const validated = decommissionDeviceSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const device = await db.query.devices.findFirst({ where: eq(devices.id, id) });
    if (!device) return { success: false, error: 'Device not found' };
    if (device.lifecycleStatus === 'decommissioned') {
      return { success: false, error: 'Device is already decommissioned' };
    }

    return await db.transaction(async (tx) => {
      await tx.insert(deviceStatusHistory).values({
        organizationId: device.organizationId,
        deviceId: id,
        previousStatusCode: device.currentStatusCode,
        newStatusCode: 'decommissioned',
        reason: validated.data.reason,
        changedByUserId: session.id,
      });

      const [updated] = await tx.update(devices).set({
        currentStatusCode: 'decommissioned',
        lifecycleStatus: 'decommissioned',
        decommissionedAt: new Date(),
        decommissionedByUserId: session.id,
        decommissionReason: validated.data.reason,
        statusChangedAt: new Date(),
        statusChangedByUserId: session.id,
        updatedByUserId: session.id,
        updatedAt: new Date(),
      }).where(eq(devices.id, id)).returning();

      await createAuditLog(tx, {
        action: 'DEACTIVATE', entityType: 'device', entityId: id,
        actorId: session.id, details: validated.data,
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Status & Location History ───────────────────────────────────────────────────

export async function getDeviceStatusHistory(deviceId: string) {
  await requireAuth();
  try {
    const data = await db.query.deviceStatusHistory.findMany({
      where: eq(deviceStatusHistory.deviceId, deviceId),
      with: { changedByUser: true },
      orderBy: [desc(deviceStatusHistory.effectiveAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDeviceLocationHistory(deviceId: string) {
  await requireAuth();
  try {
    const data = await db.query.deviceLocationHistory.findMany({
      where: eq(deviceLocationHistory.deviceId, deviceId),
      with: { changedByUser: true, newHospital: true, newDepartment: true },
      orderBy: [desc(deviceLocationHistory.effectiveAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Maintenance History ────────────────────────────────────────────────────────

export async function getDeviceMaintenanceHistory(deviceId: string) {
  await requireAuth();
  try {
    const tasks = await db.query.maintenanceTasks.findMany({
      where: eq(maintenanceTasks.deviceId, deviceId),
      with: {
        assignedEngineer: true,
      },
      orderBy: [desc(maintenanceTasks.createdAt)],
    });

    const records = await db.query.maintenanceRecords.findMany({
      where: eq(maintenanceRecords.deviceId, deviceId),
      orderBy: [desc(maintenanceRecords.completedAt)],
    });

    return { success: true, data: { tasks, records } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Device Signatures & Audit Events ───────────────────────────────────────────

export async function getDeviceSignatures(deviceId: string) {
  await requireAuth();
  try {
    // 1. Find all maintenance records for this device
    const records = await db.query.maintenanceRecords.findMany({
      where: eq(maintenanceRecords.deviceId, deviceId),
      columns: { id: true },
    });
    const recordIds = records.map((r) => r.id);

    // 2. Find all service tickets for this device
    const tickets = await db.query.serviceTickets.findMany({
      where: eq(serviceTickets.deviceId, deviceId),
      columns: { id: true },
    });
    const ticketIds = tickets.map((t) => t.id);

    // 3. Fetch signatures for the device itself, its maintenance records, or its service tickets
    const conditions = [
      and(
        eq(electronicSignatures.entityType, 'device_status_change'),
        eq(electronicSignatures.entityId, deviceId),
      ),
    ];

    if (recordIds.length > 0) {
      conditions.push(
        and(
          eq(electronicSignatures.entityType, 'maintenance_record'),
          inArray(electronicSignatures.entityId, recordIds),
        ),
      );
    }

    if (ticketIds.length > 0) {
      conditions.push(
        and(
          eq(electronicSignatures.entityType, 'ticket_resolution'),
          inArray(electronicSignatures.entityId, ticketIds),
        ),
      );
    }

    const signatures = await db.query.electronicSignatures.findMany({
      where: or(...conditions),
      with: {
        signerUser: true,
      },
      orderBy: [desc(electronicSignatures.signedAt)],
    });

    // 4. Fetch associated signature events (hash chain audit)
    const sigIds = signatures.map((s) => s.id);
    let events: any[] = [];
    if (sigIds.length > 0) {
      events = await db.query.signatureEvents.findMany({
        where: inArray(signatureEvents.signatureId, sigIds),
        orderBy: [desc(signatureEvents.timestamp)],
      });
    }

    return { success: true, data: { signatures, events } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Device Documents & Attachments ─────────────────────────────────────────────

export async function getDeviceDocuments(deviceId: string) {
  await requireAuth();
  try {
    const documents = await db.query.deviceAttachments.findMany({
      where: eq(deviceAttachments.deviceId, deviceId),
      with: {
        uploadedByUser: true,
      },
      orderBy: [desc(deviceAttachments.uploadedAt)],
    });
    return { success: true, data: documents };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Role-Shaped Device Profile (Spec §5) ───────────────────────────────────────

export type DeviceProfileLevel = 'staff' | 'department_manager' | 'technician' | 'biomedical_engineer' | 'admin';

export interface RoleShapedDeviceProfile {
  device: any;
  profileLevel: DeviceProfileLevel;
  visibleSections: string[];
  allowedActions: string[];
}

export async function getDeviceProfile(deviceId: string): Promise<{
  success: boolean;
  data?: RoleShapedDeviceProfile;
  error?: string;
}> {
  const session = await requireAuth();
  try {
    const device = await db.query.devices.findFirst({
      where: eq(devices.id, deviceId),
      with: {
        organization: true,
        hospital: true,
        department: true,
        location: true,
        deviceCategory: true,
        manufacturer: true,
        deviceModel: true,
        assignedEngineer: true,
      },
    });

    if (!device) return { success: false, error: 'Device not found' };

    const roles = session.roles || [];
    const isSysAdmin = roles.includes('SYS_ADMIN');
    const isOrgAdmin = roles.includes('ORG_ADMIN');
    const isBiomedMgr = roles.includes('BIOMED_MGR');
    const isBiomedEng = roles.includes('BIOMED_ENG');
    const isBiomedTech = roles.includes('BIOMED_TECH');
    const isDeptMgr = roles.includes('DEPT_MGR') || roles.includes('CLINICAL_HEAD');

    let profileLevel: DeviceProfileLevel = 'staff';
    let visibleSections = ['overview', 'active-tickets', 'documents'];
    let allowedActions = ['report_problem', 'view_qr'];

    if (isSysAdmin || isBiomedMgr || isBiomedEng) {
      profileLevel = isSysAdmin && !isBiomedEng && !isBiomedMgr ? 'admin' : 'biomedical_engineer';
      visibleSections = [
        'overview',
        'technical',
        'maintenance',
        'signatures',
        'status-history',
        'location-history',
        'documents',
      ];
      allowedActions = [
        'report_problem',
        'view_qr',
        'edit',
        'transfer',
        'change_status',
        'decommission',
        'create_maintenance',
      ];
    } else if (isBiomedTech) {
      profileLevel = 'technician';
      visibleSections = [
        'overview',
        'technical',
        'maintenance',
        'status-history',
        'location-history',
        'documents',
      ];
      allowedActions = ['report_problem', 'view_qr', 'change_status', 'perform_work'];
    } else if (isDeptMgr) {
      profileLevel = 'department_manager';
      visibleSections = ['overview', 'active-tickets', 'maintenance-summary', 'documents'];
      allowedActions = ['report_problem', 'view_qr'];
    } else {
      // Staff / Doctor view: simple operational safety focus
      profileLevel = 'staff';
      visibleSections = ['overview', 'active-tickets', 'documents'];
      allowedActions = ['report_problem', 'view_qr'];
    }

    return {
      success: true,
      data: {
        device,
        profileLevel,
        visibleSections,
        allowedActions,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

