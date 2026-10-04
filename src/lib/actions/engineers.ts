'use server';

import { db } from '@/lib/db';
import { engineerProfiles, users, departments, devices, serviceTickets, maintenanceTasks, hospitals } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { EngineerDutyStatus } from '@/lib/db/schema/engineer-profiles';

export interface EngineerTeamMember {
  id: string; // engineer profile id
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string;
  specialization: string | null;
  extension: string | null;
  mobileNumber: string | null;
  dutyStatus: EngineerDutyStatus;
  shiftHours: string | null;
  workingDays: string[];
  onCallDays: string[];
  coveredDepartmentIds: string[];
  coveredDepartments: { id: string; name: string; code: string }[];
  emergencyPriority: string | null;
  notes: string | null;
  hospitalName: string | null;
  activeTicketsCount: number;
  activeMaintenanceCount: number;
  assignedDevicesCount: number;
}

export async function getEngineersTeam(): Promise<{
  success: boolean;
  data?: EngineerTeamMember[];
  stats?: {
    totalEngineers: number;
    onDutyToday: number;
    onCallToday: number;
    inMaintenanceToday: number;
    offDutyToday: number;
    totalActiveWorkOrders: number;
  };
  error?: string;
}> {
  await requireAuth();

  try {
    const profiles = await db.query.engineerProfiles.findMany({
      with: {
        user: true,
        hospital: true,
      },
    });

    const allDepts = await db.query.departments.findMany();
    const deptMap = new Map(allDepts.map((d) => [d.id, { id: d.id, name: d.name, code: d.code }]));

    const userIds = profiles.map((p) => p.userId);

    // Count active tickets per engineer
    const activeTicketsCounts = userIds.length > 0 ? await db
      .select({
        engineerId: serviceTickets.assignedEngineerUserId,
        count: sql<number>`count(*)::int`,
      })
      .from(serviceTickets)
      .where(
        and(
          inArray(serviceTickets.assignedEngineerUserId, userIds),
          inArray(serviceTickets.statusCode, ['assigned', 'in_progress', 'waiting_for_parts'] as any)
        )
      )
      .groupBy(serviceTickets.assignedEngineerUserId) : [];

    const ticketMap = new Map(activeTicketsCounts.map((t) => [t.engineerId!, t.count]));

    // Count active maintenance tasks per engineer
    const activeMaintCounts = userIds.length > 0 ? await db
      .select({
        engineerId: maintenanceTasks.assignedEngineerUserId,
        count: sql<number>`count(*)::int`,
      })
      .from(maintenanceTasks)
      .where(
        and(
          inArray(maintenanceTasks.assignedEngineerUserId, userIds),
          inArray(maintenanceTasks.statusCode, ['assigned', 'in_progress', 'waiting_for_parts', 'awaiting_review'] as any)
        )
      )
      .groupBy(maintenanceTasks.assignedEngineerUserId) : [];

    const maintMap = new Map(activeMaintCounts.map((m) => [m.engineerId!, m.count]));

    // Count assigned devices per engineer
    const assignedDevCounts = userIds.length > 0 ? await db
      .select({
        engineerId: devices.assignedEngineerUserId,
        count: sql<number>`count(*)::int`,
      })
      .from(devices)
      .where(inArray(devices.assignedEngineerUserId, userIds))
      .groupBy(devices.assignedEngineerUserId) : [];

    const devMap = new Map(assignedDevCounts.map((d) => [d.engineerId!, d.count]));

    const members: EngineerTeamMember[] = profiles.map((p) => {
      const deptIds = (p.coveredDepartmentIds as string[]) || [];
      const coveredDepts = deptIds.map((id) => deptMap.get(id)).filter(Boolean) as { id: string; name: string; code: string }[];

      return {
        id: p.id,
        userId: p.userId,
        fullName: p.user.fullName,
        email: p.user.email,
        avatarUrl: p.user.avatarUrl,
        jobTitle: p.jobTitle,
        specialization: p.specialization,
        extension: p.extension,
        mobileNumber: p.mobileNumber || p.user.phone,
        dutyStatus: p.dutyStatus as EngineerDutyStatus,
        shiftHours: p.shiftHours,
        workingDays: (p.workingDays as string[]) || [],
        onCallDays: (p.onCallDays as string[]) || [],
        coveredDepartmentIds: deptIds,
        coveredDepartments: coveredDepts,
        emergencyPriority: p.emergencyPriority,
        notes: p.notes,
        hospitalName: p.hospital?.name || null,
        activeTicketsCount: ticketMap.get(p.userId) || 0,
        activeMaintenanceCount: maintMap.get(p.userId) || 0,
        assignedDevicesCount: devMap.get(p.userId) || 0,
      };
    });

    const totalEngineers = members.length;
    const onDutyToday = members.filter((m) => m.dutyStatus === 'on_duty').length;
    const onCallToday = members.filter((m) => m.dutyStatus === 'on_call').length;
    const inMaintenanceToday = members.filter((m) => m.dutyStatus === 'in_maintenance').length;
    const offDutyToday = members.filter((m) => m.dutyStatus === 'off_duty').length;
    const totalActiveWorkOrders = members.reduce((sum, m) => sum + m.activeTicketsCount + m.activeMaintenanceCount, 0);

    return {
      success: true,
      data: members,
      stats: {
        totalEngineers,
        onDutyToday,
        onCallToday,
        inMaintenanceToday,
        offDutyToday,
        totalActiveWorkOrders,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEngineerDutyStatus(
  profileId: string,
  newStatus: EngineerDutyStatus
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  try {
    await db
      .update(engineerProfiles)
      .set({
        dutyStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(engineerProfiles.id, profileId));

    revalidatePath('/team');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEngineerProfile(
  profileId: string,
  data: {
    jobTitle?: string;
    specialization?: string;
    extension?: string;
    mobileNumber?: string;
    shiftHours?: string;
    workingDays?: string[];
    onCallDays?: string[];
    coveredDepartmentIds?: string[];
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');

  try {
    await db
      .update(engineerProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(engineerProfiles.id, profileId));

    revalidatePath('/team');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentCoverageMatrix(): Promise<{
  success: boolean;
  departments?: {
    id: string;
    name: string;
    code: string;
    deviceCount: number;
    primaryEngineer: {
      id: string;
      fullName: string;
      jobTitle: string;
      extension: string | null;
      mobileNumber: string | null;
      dutyStatus: EngineerDutyStatus;
    } | null;
  }[];
  error?: string;
}> {
  await requireAuth();

  try {
    const depts = await db.query.departments.findMany();
    const profiles = await db.query.engineerProfiles.findMany({
      with: { user: true },
    });

    // Count devices per department
    const deviceCounts = await db
      .select({
        departmentId: devices.departmentId,
        count: sql<number>`count(*)::int`,
      })
      .from(devices)
      .groupBy(devices.departmentId);

    const devCountMap = new Map(deviceCounts.map((dc) => [dc.departmentId, dc.count]));

    const coverage = depts.map((d) => {
      // Find engineer that covers this department
      const eng = profiles.find((p) => {
        const covered = (p.coveredDepartmentIds as string[]) || [];
        return covered.includes(d.id);
      });

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        deviceCount: devCountMap.get(d.id) || 0,
        primaryEngineer: eng
          ? {
              id: eng.id,
              fullName: eng.user.fullName,
              jobTitle: eng.jobTitle,
              extension: eng.extension,
              mobileNumber: eng.mobileNumber || eng.user.phone,
              dutyStatus: eng.dutyStatus as EngineerDutyStatus,
            }
          : null,
      };
    });

    return { success: true, departments: coverage };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
