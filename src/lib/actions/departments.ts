'use server';

import { db } from '@/lib/db';
import { departments, hospitals, devices, serviceTickets, locations, users } from '@/lib/db/schema';
import { requireAuth, requireRole, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createDepartmentSchema, updateDepartmentSchema } from '@/lib/validators/departments';
import { DEFAULT_HOSPITAL_DEPARTMENTS } from '@/lib/constants/departments';
import { eq, and, sql, count } from 'drizzle-orm';

export async function getDepartments(filters?: { hospitalId?: string; organizationId?: string } | string) {
  await requireAuth();
  try {
    let whereClause = undefined;
    if (typeof filters === 'string') {
      whereClause = eq(departments.hospitalId, filters);
    } else if (filters?.hospitalId) {
      whereClause = eq(departments.hospitalId, filters.hospitalId);
    } else if (filters?.organizationId) {
      whereClause = eq(departments.organizationId, filters.organizationId);
    }
    const data = await db.query.departments.findMany({ where: whereClause });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.departments.findFirst({
      where: eq(departments.id, id),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDepartment(input: unknown) {
  const session = await requireAuth();
  const validated = createDepartmentSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  await requireScope({ organizationId: validated.data.organizationId, hospitalId: validated.data.hospitalId });

  try {
    const dataToInsert = {
      ...validated.data,
      managerUserId: validated.data.managerUserId ? validated.data.managerUserId : null,
    };
    return await db.transaction(async (tx) => {
      const [newDept] = await tx.insert(departments).values(dataToInsert).returning();
      await createAuditLog(tx, {
        action: 'CREATE',
        entityType: 'department',
        entityId: newDept.id,
        actorId: session.id,
        details: dataToInsert,
      });
      return { success: true, data: newDept };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDepartment(id: string, input: unknown) {
  const session = await requireAuth();
  const validated = updateDepartmentSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  try {
    const dept = await db.query.departments.findFirst({ where: eq(departments.id, id) });
    if (!dept) return { success: false, error: 'Department not found' };
    await requireScope({ organizationId: dept.organizationId, hospitalId: dept.hospitalId, departmentId: id });

    const dataToUpdate = {
      ...validated.data,
      ...(validated.data.managerUserId !== undefined
        ? { managerUserId: validated.data.managerUserId ? validated.data.managerUserId : null }
        : {}),
    };

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(departments).set(dataToUpdate).where(eq(departments.id, id)).returning();
      await createAuditLog(tx, {
        action: 'UPDATE',
        entityType: 'department',
        entityId: id,
        actorId: session.id,
        details: dataToUpdate,
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveDepartment(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  
  try {
    const dept = await db.query.departments.findFirst({ where: eq(departments.id, id) });
    if (!dept) return { success: false, error: 'Department not found' };
    await requireScope({ organizationId: dept.organizationId, hospitalId: dept.hospitalId, departmentId: id });

    return await db.transaction(async (tx) => {
      const [archived] = await tx.update(departments).set({ status: 'archived' }).where(eq(departments.id, id)).returning();
      await createAuditLog(tx, {
        action: 'ARCHIVE',
        entityType: 'department',
        entityId: id,
        actorId: session.id,
        details: { status: 'archived' },
      });
      return { success: true, data: archived };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentsOverview(filters?: { hospitalId?: string }) {
  const session = await requireAuth();
  try {
    const orgId = session.organizationId;
    
    // Fetch hospitals for organization selector
    const hospitalsList = await db.query.hospitals.findMany({
      where: orgId ? eq(hospitals.organizationId, orgId) : undefined,
      orderBy: (h, { asc }) => [asc(h.name)],
    });

    // Build conditions for departments
    const conditions = [];
    if (orgId) conditions.push(eq(departments.organizationId, orgId));
    if (filters?.hospitalId && filters.hospitalId !== 'all') {
      conditions.push(eq(departments.hospitalId, filters.hospitalId));
    }
    conditions.push(eq(departments.status, 'active'));

    const depts = await db.query.departments.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        hospital: true,
        manager: true,
      },
      orderBy: (d, { asc }) => [asc(d.name)],
    });

    // Fetch device counts per department
    const deviceStats = await db
      .select({
        departmentId: devices.departmentId,
        totalDevices: count(devices.id),
        operationalDevices: count(
          sql`CASE WHEN ${devices.currentStatusCode} = 'operational' THEN 1 END`
        ),
        outOfServiceDevices: count(
          sql`CASE WHEN ${devices.currentStatusCode} IN ('out_of_service', 'under_repair', 'under_maintenance') THEN 1 END`
        ),
      })
      .from(devices)
      .where(orgId ? eq(devices.organizationId, orgId) : undefined)
      .groupBy(devices.departmentId);

    // Fetch active ticket counts per department (status not in closed, resolved, cancelled)
    const ticketStats = await db
      .select({
        departmentId: serviceTickets.departmentId,
        activeTickets: count(serviceTickets.id),
      })
      .from(serviceTickets)
      .where(
        and(
          orgId ? eq(serviceTickets.organizationId, orgId) : undefined,
          sql`${serviceTickets.statusCode} NOT IN ('resolved', 'closed', 'cancelled')`
        )
      )
      .groupBy(serviceTickets.departmentId);

    const deviceStatsMap = new Map(deviceStats.map(s => [s.departmentId, s]));
    const ticketStatsMap = new Map(ticketStats.map(s => [s.departmentId, Number(s.activeTickets) || 0]));

    const result = depts.map(dept => {
      const dStats = deviceStatsMap.get(dept.id);
      const total = Number(dStats?.totalDevices) || 0;
      const operational = Number(dStats?.operationalDevices) || 0;
      const outOfService = Number(dStats?.outOfServiceDevices) || 0;
      const activeTickets = ticketStatsMap.get(dept.id) || 0;

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        departmentType: dept.departmentType,
        status: dept.status,
        hospital: dept.hospital,
        manager: dept.manager ? { id: dept.manager.id, fullName: dept.manager.fullName, email: dept.manager.email } : null,
        stats: {
          totalDevices: total,
          operationalDevices: operational,
          outOfServiceDevices: outOfService,
          activeTickets,
          operationalRate: total > 0 ? Math.round((operational / total) * 100) : 100,
        },
      };
    });

    return {
      success: true,
      data: {
        departments: result,
        hospitals: hospitalsList.map(h => ({ id: h.id, name: h.name, code: h.code })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentDetails(departmentId: string) {
  await requireAuth();
  try {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId),
      with: {
        hospital: true,
        manager: true,
      },
    });

    if (!dept) {
      return { success: false, error: 'Department not found' };
    }

    // Devices in this department
    const deptDevices = await db.query.devices.findMany({
      where: eq(devices.departmentId, departmentId),
      with: {
        deviceCategory: true,
        manufacturer: true,
        location: true,
      },
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });

    // Active tickets in this department
    const deptTickets = await db.query.serviceTickets.findMany({
      where: and(
        eq(serviceTickets.departmentId, departmentId),
        sql`${serviceTickets.statusCode} NOT IN ('resolved', 'closed', 'cancelled')`
      ),
      with: {
        device: true,
        reportedByUser: true,
      },
      orderBy: (t, { desc }) => [desc(t.reportedAt)],
    });

    // Locations / rooms in this department
    const deptLocations = await db.query.locations.findMany({
      where: eq(locations.departmentId, departmentId),
      orderBy: (l, { asc }) => [asc(l.name)],
    });

    // Summary stats
    const totalDevices = deptDevices.length;
    const operationalDevices = deptDevices.filter(d => d.currentStatusCode === 'operational').length;
    const outOfServiceDevices = deptDevices.filter(d => 
      ['out_of_service', 'under_repair', 'under_maintenance'].includes(d.currentStatusCode)
    ).length;

    return {
      success: true,
      data: {
        department: {
          ...dept,
          hospitalName: dept.hospital?.name,
          managerName: dept.manager?.fullName,
        },
        devices: deptDevices,
        tickets: deptTickets,
        locations: deptLocations,
        stats: {
          totalDevices,
          operationalDevices,
          outOfServiceDevices,
          activeTicketsCount: deptTickets.length,
          operationalRate: totalDevices > 0 ? Math.round((operationalDevices / totalDevices) * 100) : 100,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Default Clinical Departments ──────────────────────────────────────────────

export async function seedDefaultDepartmentsForHospital(hospitalId: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN');

  try {
    const hospital = await db.query.hospitals.findFirst({
      where: eq(hospitals.id, hospitalId),
    });
    if (!hospital) return { success: false, error: 'Hospital not found' };

    await requireScope({ organizationId: hospital.organizationId, hospitalId });

    // Fetch existing department codes for this hospital
    const existing = await db.query.departments.findMany({
      where: eq(departments.hospitalId, hospitalId),
      columns: { code: true, name: true },
    });
    const existingCodes = new Set(existing.map((d) => d.code.toUpperCase()));
    const existingNames = new Set(existing.map((d) => d.name.toLowerCase()));

    const toInsert = DEFAULT_HOSPITAL_DEPARTMENTS.filter((dept) => {
      const nameMatch = existingNames.has(dept.name.toLowerCase());
      const codeMatch = existingCodes.has(dept.code.toUpperCase());
      const partialCodeMatch = Array.from(existingCodes).some(
        (c) => c.startsWith(dept.code) || dept.code.startsWith(c)
      );
      const partialNameMatch = Array.from(existingNames).some(
        (n) => n.includes(dept.departmentType.toLowerCase()) || dept.name.toLowerCase().includes(n)
      );
      return !nameMatch && !codeMatch && !partialCodeMatch && !partialNameMatch;
    });

    if (toInsert.length === 0) {
      return { success: true, message: 'All default departments already exist', count: 0 };
    }

    const inserted = await db.transaction(async (tx) => {
      const records = [];
      for (const d of toInsert) {
        const [newDept] = await tx.insert(departments).values({
          organizationId: hospital.organizationId,
          hospitalId: hospital.id,
          name: d.name,
          code: d.code,
          departmentType: d.departmentType,
          status: 'active',
          managerUserId: session.id,
          createdByUserId: session.id,
        }).onConflictDoNothing().returning();
        if (newDept) records.push(newDept);
      }
      return records;
    });

    return { success: true, count: inserted.length, data: inserted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


