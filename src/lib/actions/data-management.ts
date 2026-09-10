'use server';

import { db } from '@/lib/db';
import {
  devices,
  deviceCategories,
  manufacturers,
  departments,
  hospitals,
  organizations,
  users,
  serviceTickets,
  maintenanceTasks,
  maintenanceScheduleOccurrences,
  maintenanceRecords,
  auditLogs,
} from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { verifyPassword } from '@/lib/auth/password';
import { parseCSV } from '@/lib/utils/csv-parser';
import {
  deviceImportRowSchema,
  type DeviceImportValidationResult,
  type PurgeDataPayload,
  purgeDataSchema,
} from '@/lib/validators/data-management';
import { eq, sql, inArray } from 'drizzle-orm';

/**
 * Validates a batch of device records from raw CSV content.
 */
export async function validateDeviceImport(csvContent: string): Promise<{
  success: boolean;
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  rows: DeviceImportValidationResult[];
  error?: string;
}> {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');

  try {
    const rawRecords = parseCSV(csvContent);
    if (rawRecords.length === 0) {
      return {
        success: false,
        totalRows: 0,
        validCount: 0,
        warningCount: 0,
        errorCount: 0,
        rows: [],
        error: 'No valid data rows found in CSV. Please ensure the file includes column headers.',
      };
    }

    // Resolve target organization and hospital
    let org = await db.query.organizations.findFirst();
    if (session.organizationId) {
      const foundOrg = await db.query.organizations.findFirst({
        where: eq(organizations.id, session.organizationId),
      });
      if (foundOrg) org = foundOrg;
    }

    if (!org) {
      return {
        success: false,
        totalRows: 0,
        validCount: 0,
        warningCount: 0,
        errorCount: 0,
        rows: [],
        error: 'Organization not found. Please configure an organization first.',
      };
    }

    // Load existing database entities for validation
    const [existingDevices, existingCategories, existingManufacturers, existingDepartments] =
      await Promise.all([
        db.query.devices.findMany({
          where: eq(devices.organizationId, org.id),
          columns: { assetNumber: true, internalCode: true },
        }),
        db.query.deviceCategories.findMany({
          where: eq(deviceCategories.organizationId, org.id),
        }),
        db.query.manufacturers.findMany({
          where: eq(manufacturers.organizationId, org.id),
        }),
        db.query.departments.findMany(),
      ]);

    const existingAssetNumbers = new Set(existingDevices.map((d) => d.assetNumber.toLowerCase().trim()));
    const existingCodes = new Set(existingDevices.map((d) => d.internalCode.toLowerCase().trim()));

    const categoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase().trim(), c]));
    const manufacturerMap = new Map(existingManufacturers.map((m) => [m.name.toLowerCase().trim(), m]));
    const departmentMap = new Map(existingDepartments.map((d) => [d.name.toLowerCase().trim(), d]));

    const results: DeviceImportValidationResult[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    const currentBatchAssetNumbers = new Set<string>();

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const rowNumber = i + 2; // Account for 1-based index and header line

      // Map potential CSV header variants
      const mappedRow = {
        assetNumber: row.asset_number || row.assetnumber || row.asset_id || row.tag || '',
        name: row.name || row.device_name || row.equipment_name || row.title || '',
        model: row.model || row.device_model || row.model_name || '',
        serialNumber: row.serial_number || row.serialnumber || row.serial || '',
        categoryName: row.category || row.category_name || row.device_category || '',
        manufacturerName: row.manufacturer || row.manufacturer_name || row.vendor || row.make || '',
        departmentName: row.department || row.department_name || row.dept || '',
        locationDescription: row.location || row.location_description || row.room || '',
        riskClassification: (row.risk_classification || row.risk || 'class_i') as any,
        criticalityLevel: (row.criticality || row.criticality_level || 'medium') as any,
      };

      const parseResult = deviceImportRowSchema.safeParse(mappedRow);
      const messages: string[] = [];
      let status: 'valid' | 'warning' | 'error' = 'valid';

      if (!parseResult.success) {
        status = 'error';
        parseResult.error.errors.forEach((err) => messages.push(err.message));
      }

      const validData = parseResult.success ? parseResult.data : mappedRow;
      const cleanAsset = validData.assetNumber.toLowerCase().trim();

      // Duplicate asset number checks
      if (cleanAsset) {
        if (existingAssetNumbers.has(cleanAsset)) {
          status = 'error';
          messages.push(`Asset number "${validData.assetNumber}" already exists in the database.`);
        } else if (currentBatchAssetNumbers.has(cleanAsset)) {
          status = 'error';
          messages.push(`Duplicate asset number "${validData.assetNumber}" within this CSV file.`);
        } else {
          currentBatchAssetNumbers.add(cleanAsset);
        }
      }

      // Department resolution
      let resolvedDepartmentId: string | undefined;
      const cleanDept = validData.departmentName.toLowerCase().trim();
      const matchedDept = departmentMap.get(cleanDept);
      if (matchedDept) {
        resolvedDepartmentId = matchedDept.id;
      } else if (existingDepartments.length > 0) {
        // Fallback to first department with a warning if unspecified
        resolvedDepartmentId = existingDepartments[0].id;
        if (status !== 'error') {
          status = 'warning';
          messages.push(`Department "${validData.departmentName}" not found; defaulted to "${existingDepartments[0].name}".`);
        }
      } else {
        status = 'error';
        messages.push('No departments exist. Please register a department first.');
      }

      // Category resolution
      let resolvedCategoryId: string | undefined;
      let willCreateCategory = false;
      const cleanCat = validData.categoryName.toLowerCase().trim();
      const matchedCat = categoryMap.get(cleanCat);
      if (matchedCat) {
        resolvedCategoryId = matchedCat.id;
      } else {
        willCreateCategory = true;
        if (status !== 'error') {
          status = 'warning';
          messages.push(`Category "${validData.categoryName}" will be auto-created.`);
        }
      }

      // Manufacturer resolution
      let resolvedManufacturerId: string | undefined;
      let willCreateManufacturer = false;
      const cleanMfr = validData.manufacturerName.toLowerCase().trim();
      const matchedMfr = manufacturerMap.get(cleanMfr);
      if (matchedMfr) {
        resolvedManufacturerId = matchedMfr.id;
      } else if (validData.manufacturerName) {
        willCreateManufacturer = true;
        if (status !== 'error') {
          status = 'warning';
          messages.push(`Manufacturer "${validData.manufacturerName}" will be auto-created.`);
        }
      }

      if (status === 'error') {
        errorCount++;
      } else if (status === 'warning') {
        warningCount++;
      } else {
        validCount++;
      }

      results.push({
        rowNumber,
        data: validData as any,
        status,
        messages,
        resolvedCategoryId,
        resolvedManufacturerId,
        resolvedDepartmentId,
        willCreateCategory,
        willCreateManufacturer,
      });
    }

    return {
      success: true,
      totalRows: rawRecords.length,
      validCount,
      warningCount,
      errorCount,
      rows: results,
    };
  } catch (error: any) {
    return {
      success: false,
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      rows: [],
      error: error.message || 'Failed to parse and validate CSV file.',
    };
  }
}

/**
 * Commits pre-validated device records to the database.
 */
export async function executeDeviceImport(rows: DeviceImportValidationResult[]): Promise<{
  success: boolean;
  importedCount: number;
  error?: string;
}> {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');

  // Filter out any error rows
  const importableRows = rows.filter((r) => r.status === 'valid' || r.status === 'warning');
  if (importableRows.length === 0) {
    return { success: false, importedCount: 0, error: 'No valid rows available to import.' };
  }

  // Resolve target organization and hospital
  let org = await db.query.organizations.findFirst();
  if (session.organizationId) {
    const foundOrg = await db.query.organizations.findFirst({
      where: eq(organizations.id, session.organizationId),
    });
    if (foundOrg) org = foundOrg;
  }

  const defaultHospital = await db.query.hospitals.findFirst();
  if (!org || !defaultHospital) {
    return { success: false, importedCount: 0, error: 'Organization or hospital facility not found.' };
  }

  try {
    return await db.transaction(async (tx) => {
      const createdCategories = new Map<string, string>();
      const createdManufacturers = new Map<string, string>();

      let importedCount = 0;

      for (const rowItem of importableRows) {
        const { data } = rowItem;

        // 1. Resolve or create category
        let categoryId = rowItem.resolvedCategoryId;
        if (!categoryId || rowItem.willCreateCategory) {
          const catKey = data.categoryName.toLowerCase().trim();
          if (createdCategories.has(catKey)) {
            categoryId = createdCategories.get(catKey)!;
          } else {
            const [newCat] = await tx
              .insert(deviceCategories)
              .values({
                organizationId: org.id,
                name: data.categoryName,
                code: data.categoryName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'CAT',
                riskClassification: data.riskClassification as any,
                criticalityLevel: data.criticalityLevel as any,
              })
              .returning();
            categoryId = newCat.id;
            createdCategories.set(catKey, newCat.id);
          }
        }

        // 2. Resolve or create manufacturer
        let manufacturerId = rowItem.resolvedManufacturerId;
        if (data.manufacturerName && (!manufacturerId || rowItem.willCreateManufacturer)) {
          const mfrKey = data.manufacturerName.toLowerCase().trim();
          if (createdManufacturers.has(mfrKey)) {
            manufacturerId = createdManufacturers.get(mfrKey)!;
          } else {
            const [newMfr] = await tx
              .insert(manufacturers)
              .values({
                organizationId: org.id,
                name: data.manufacturerName,
                code: data.manufacturerName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'MFR',
              })
              .returning();
            manufacturerId = newMfr.id;
            createdManufacturers.set(mfrKey, newMfr.id);
          }
        }

        // 3. Insert Device
        await tx.insert(devices).values({
          organizationId: org.id,
          hospitalId: defaultHospital.id,
          departmentId: rowItem.resolvedDepartmentId!,
          internalCode: data.assetNumber,
          assetNumber: data.assetNumber,
          name: data.name,
          serialNumber: data.serialNumber || null,
          modelNameFree: data.model || null,
          deviceCategoryId: categoryId!,
          manufacturerId: manufacturerId || null,
          exactLocationDescription: data.locationDescription || null,
          criticalityLevel: data.criticalityLevel as any,
          riskClassification: data.riskClassification as any,
          currentStatusCode: 'operational',
        });

        importedCount++;
      }

      // Log immutable audit trail entry
      await createAuditLog(tx, {
        action: 'BULK_IMPORT',
        entityType: 'devices',
        entityId: org.id,
        actorUserId: session.id,
        organizationId: org.id,
        details: {
          importedCount,
          autoCreatedCategories: createdCategories.size,
          autoCreatedManufacturers: createdManufacturers.size,
        },
        changeReason: `Bulk imported ${importedCount} medical equipment records from CSV`,
      });

      return { success: true, importedCount };
    });
  } catch (error: any) {
    return { success: false, importedCount: 0, error: error.message };
  }
}

/**
 * Returns entity counts for the export center.
 */
export async function getExportSummary() {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');

  try {
    const [devicesCount, departmentsCount, categoriesCount, manufacturersCount, ticketsCount, auditLogsCount] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(devices),
        db.select({ count: sql<number>`count(*)` }).from(departments),
        db.select({ count: sql<number>`count(*)` }).from(deviceCategories),
        db.select({ count: sql<number>`count(*)` }).from(manufacturers),
        db.select({ count: sql<number>`count(*)` }).from(serviceTickets),
        db.select({ count: sql<number>`count(*)` }).from(auditLogs),
      ]);

    return {
      success: true,
      data: {
        devices: Number(devicesCount[0]?.count || 0),
        departments: Number(departmentsCount[0]?.count || 0),
        categories: Number(categoriesCount[0]?.count || 0),
        manufacturers: Number(manufacturersCount[0]?.count || 0),
        tickets: Number(ticketsCount[0]?.count || 0),
        auditLogs: Number(auditLogsCount[0]?.count || 0),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * High-friction purge and reset tool with password verification and audit trace.
 */
export async function purgeData(payload: PurgeDataPayload): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const session = await requireAuth();
  // Strictly restricted to SYS_ADMIN
  await requireRole('SYS_ADMIN');

  const validated = purgeDataSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0]?.message || 'Invalid parameters' };
  }

  const { scope, confirmText, password, reason } = validated.data;

  // 1. Verify confirmation phrase
  const expectedPhrase = scope === 'test_transactions' ? 'PURGE TEST DATA' : 'RESET ALL DATA';
  if (confirmText.trim() !== expectedPhrase) {
    return {
      success: false,
      error: `Confirmation phrase must exactly match "${expectedPhrase}".`,
    };
  }

  // 2. Re-authenticate admin password (21 CFR Part 11 electronic signature standard)
  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, session.id),
  });

  if (!adminUser || !adminUser.passwordHash) {
    return { success: false, error: 'User account verification failed.' };
  }

  const isPasswordValid = await verifyPassword(password, adminUser.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: 'Incorrect administrator password. Re-authentication rejected.' };
  }

  try {
    return await db.transaction(async (tx) => {
      if (scope === 'test_transactions') {
        // Delete transactional records while preserving inventory and organizational setup
        await tx.delete(maintenanceRecords);
        await tx.delete(maintenanceTasks);
        await tx.delete(maintenanceScheduleOccurrences);
        await tx.delete(serviceTickets);

        await createAuditLog(tx, {
          action: 'PURGE_TEST_DATA',
          entityType: 'system',
          entityId: session.id,
          actorUserId: session.id,
          changeReason: reason || 'Purged transactional test tickets and maintenance logs prior to deployment',
          details: { scope: 'test_transactions', executedAt: new Date().toISOString() },
        });

        return {
          success: true,
          message: 'Transactional test data (tickets, work orders, maintenance logs) purged successfully.',
        };
      } else {
        // Factory Reset: Purge devices, tasks, tickets, but keep core admin and system roles
        await tx.delete(maintenanceRecords);
        await tx.delete(maintenanceTasks);
        await tx.delete(maintenanceScheduleOccurrences);
        await tx.delete(serviceTickets);
        await tx.delete(devices);
        await tx.delete(auditLogs);

        return {
          success: true,
          message: 'Factory reset completed. System restored to baseline state.',
        };
      }
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
