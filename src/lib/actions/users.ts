'use server';

import { db } from '@/lib/db';
import { users, userRoleAssignments, userAccessScopes, serviceTickets, engineerProfiles } from '@/lib/db/schema';
import { requireAuth, requireRole, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { inviteUserSchema, updateUserProfileSchema, assignRoleSchema, assignScopeSchema } from '@/lib/validators/users';
import { eq, and, sql, not, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getUsers(filters?: { organizationId?: string }) {
  await requireAuth();
  try {
    const whereClause = filters?.organizationId ? eq(users.organizationId, filters.organizationId) : undefined;
    const data = await db.query.users.findMany({ where: whereClause });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        organization: true,
      },
    });
    if (!data) return { success: false, error: "User not found" };

    const roleAssignments = await db.query.userRoleAssignments.findMany({
      where: eq(userRoleAssignments.userId, id),
      with: {
        role: true,
      },
    });

    const accessScopes = await db.query.userAccessScopes.findMany({
      where: eq(userAccessScopes.userId, id),
      with: {
        hospital: true,
        department: true,
        location: true,
      },
    });

    return {
      success: true,
      data: {
        ...data,
        roleAssignments,
        roles: roleAssignments.map((ra) => ({
          ...ra.role,
          assignmentId: ra.id,
          effectiveFrom: ra.effectiveFrom,
          effectiveTo: ra.effectiveTo,
        })),
        accessScopes,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function inviteUser(input: unknown) {
  const session = await requireAuth();
  const validated = inviteUserSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  await requireScope({ organizationId: validated.data.organizationId });

  try {
    return await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(users).values({
        email: validated.data.email,
        fullName: validated.data.fullName,
        organizationId: validated.data.organizationId,
        jobTitle: validated.data.jobTitle,
        employeeIdentifier: validated.data.employeeIdentifier,
        phone: validated.data.phone,
        accountStatus: 'invited',
      }).returning();

      for (const roleId of validated.data.roleIds) {
        await tx.insert(userRoleAssignments).values({
          userId: newUser.id,
          roleId,
          assignedByUserId: session.id,
        });
      }

      await createAuditLog(tx, {
        action: 'INVITE',
        entityType: 'user',
        entityId: newUser.id,
        actorId: session.id,
        details: validated.data,
      });

      return { success: true, data: newUser };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(id: string, input: unknown) {
  const session = await requireAuth();
  const validated = updateUserProfileSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  if (session.id !== id) {
    await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  }

  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(users).set(validated.data).where(eq(users.id, id)).returning();
      await createAuditLog(tx, {
        action: 'UPDATE',
        entityType: 'user',
        entityId: id,
        actorId: session.id,
        details: validated.data,
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignUserRole(input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  const validated = assignRoleSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [assigned] = await tx.insert(userRoleAssignments).values({
        userId: validated.data.userId,
        roleId: validated.data.roleId,
        assignedByUserId: session.id,
        effectiveFrom: validated.data.effectiveFrom,
        effectiveTo: validated.data.effectiveTo,
      }).returning();
      
      await createAuditLog(tx, {
        action: 'ASSIGN_ROLE',
        entityType: 'user',
        entityId: validated.data.userId,
        actorId: session.id,
        details: validated.data,
      });

      return { success: true, data: assigned };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function revokeUserRole(assignmentId: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  try {
    return await db.transaction(async (tx) => {
      const assignment = await tx.query.userRoleAssignments.findFirst({ where: eq(userRoleAssignments.id, assignmentId) });
      if (!assignment) throw new Error("Assignment not found");

      await tx.delete(userRoleAssignments).where(eq(userRoleAssignments.id, assignmentId));
      
      await createAuditLog(tx, {
        action: 'REVOKE_ROLE',
        entityType: 'user',
        entityId: assignment.userId,
        actorId: session.id,
        details: { assignmentId },
      });

      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignUserScope(input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  const validated = assignScopeSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [assigned] = await tx.insert(userAccessScopes).values({
        userId: validated.data.userId,
        organizationId: validated.data.organizationId,
        scopeType: validated.data.scopeType,
        hospitalId: validated.data.hospitalId,
        departmentId: validated.data.departmentId,
        locationId: validated.data.locationId,
        createdByUserId: session.id,
      }).returning();
      
      await createAuditLog(tx, {
        action: 'ASSIGN_SCOPE',
        entityType: 'user',
        entityId: validated.data.userId,
        actorId: session.id,
        details: validated.data,
      });

      return { success: true, data: assigned };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function revokeUserScope(scopeId: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  try {
    return await db.transaction(async (tx) => {
      const scope = await tx.query.userAccessScopes.findFirst({ where: eq(userAccessScopes.id, scopeId) });
      if (!scope) throw new Error("Scope not found");

      await tx.delete(userAccessScopes).where(eq(userAccessScopes.id, scopeId));
      
      await createAuditLog(tx, {
        action: 'REVOKE_SCOPE',
        entityType: 'user',
        entityId: scope.userId,
        actorId: session.id,
        details: { scopeId },
      });

      return { success: true };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deactivateUser(id: string, reason?: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(users).set({ accountStatus: 'deactivated' }).where(eq(users.id, id)).returning();
      await createAuditLog(tx, {
        action: 'DEACTIVATE',
        entityType: 'user',
        entityId: id,
        actorId: session.id,
        changeReason: reason || 'Administrative deactivation',
        details: { reason },
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reactivateUser(id: string, reason?: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(users).set({ accountStatus: 'active' }).where(eq(users.id, id)).returning();
      await createAuditLog(tx, {
        action: 'REACTIVATE',
        entityType: 'user',
        entityId: id,
        actorId: session.id,
        changeReason: reason || 'Administrative reactivation',
        details: { reason },
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveUser(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(users).set({ accountStatus: 'archived' }).where(eq(users.id, id)).returning();
      await createAuditLog(tx, { action: 'ARCHIVE', entityType: 'user', entityId: id, actorId: session.id, details: {} });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Department Staff Profile Actions ──────────────────────────────────────────

export interface DepartmentStaffProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  employeeIdentifier: string | null;
  avatarUrl: string | null;
  hospitalName: string | null;
  departmentName: string | null;
  departmentId: string | null;
  hospitalId: string | null;
  roles: string[];
  activeTicketsCount: number;
  engineerProfile?: {
    id: string;
    jobTitle: string;
    specialization: string | null;
    extension: string | null;
    mobileNumber: string | null;
    dutyStatus: string;
    shiftHours: string | null;
    workingDays: string[];
    onCallDays: string[];
    coveredDepartmentIds: string[];
    notes: string | null;
  } | null;
}

export async function getCurrentUserProfile(): Promise<{
  success: boolean;
  data?: DepartmentStaffProfile;
  error?: string;
}> {
  const session = await requireAuth();
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });
    if (!user) return { success: false, error: 'User not found' };

    const scopes = await db.query.userAccessScopes.findMany({
      where: eq(userAccessScopes.userId, session.id),
      with: {
        hospital: true,
        department: true,
      },
    });

    const roleAssignments = await db.query.userRoleAssignments.findMany({
      where: eq(userRoleAssignments.userId, session.id),
      with: { role: true },
    });

    const primaryScope = scopes.find((s) => s.departmentId) || scopes[0] || null;

    const engineerProfile = await db.query.engineerProfiles.findFirst({
      where: eq(engineerProfiles.userId, session.id),
    });

    const [ticketCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTickets)
      .where(
        and(
          eq(serviceTickets.reportedByUserId, session.id),
          not(inArray(serviceTickets.statusCode, ['resolved', 'closed', 'cancelled']))
        )
      );

    return {
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        jobTitle: user.jobTitle,
        employeeIdentifier: user.employeeIdentifier,
        avatarUrl: user.avatarUrl,
        hospitalName: (primaryScope as any)?.hospital?.name || null,
        departmentName: (primaryScope as any)?.department?.name || null,
        departmentId: primaryScope?.departmentId || null,
        hospitalId: primaryScope?.hospitalId || null,
        roles: roleAssignments.map((ra) => ra.role.code),
        activeTicketsCount: ticketCount?.count || 0,
        engineerProfile: engineerProfile
          ? {
              id: engineerProfile.id,
              jobTitle: engineerProfile.jobTitle,
              specialization: engineerProfile.specialization,
              extension: engineerProfile.extension,
              mobileNumber: engineerProfile.mobileNumber,
              dutyStatus: engineerProfile.dutyStatus,
              shiftHours: engineerProfile.shiftHours,
              workingDays: (engineerProfile.workingDays as string[]) || [],
              onCallDays: (engineerProfile.onCallDays as string[]) || [],
              coveredDepartmentIds: (engineerProfile.coveredDepartmentIds as string[]) || [],
              notes: engineerProfile.notes,
            }
          : null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCurrentUserProfile(input: {
  fullName?: string;
  phone?: string;
  jobTitle?: string;
  employeeIdentifier?: string;
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const session = await requireAuth();
  const validated = updateUserProfileSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const [updated] = await db
      .update(users)
      .set({
        ...validated.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.id))
      .returning();

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentStaffProfile(userId: string): Promise<{
  success: boolean;
  data?: DepartmentStaffProfile;
  error?: string;
}> {
  await requireAuth();
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) return { success: false, error: 'User not found' };

    const scopes = await db.query.userAccessScopes.findMany({
      where: eq(userAccessScopes.userId, userId),
      with: {
        hospital: true,
        department: true,
      },
    });

    const roleAssignments = await db.query.userRoleAssignments.findMany({
      where: eq(userRoleAssignments.userId, userId),
      with: { role: true },
    });

    const primaryScope = scopes.find((s) => s.departmentId) || scopes[0] || null;

    const [ticketCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(serviceTickets)
      .where(
        and(
          eq(serviceTickets.reportedByUserId, userId),
          not(inArray(serviceTickets.statusCode, ['resolved', 'closed', 'cancelled']))
        )
      );

    return {
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        jobTitle: user.jobTitle,
        employeeIdentifier: user.employeeIdentifier,
        avatarUrl: user.avatarUrl,
        hospitalName: (primaryScope as any)?.hospital?.name || null,
        departmentName: (primaryScope as any)?.department?.name || null,
        departmentId: primaryScope?.departmentId || null,
        hospitalId: primaryScope?.hospitalId || null,
        roles: roleAssignments.map((ra) => ra.role.code),
        activeTicketsCount: ticketCount?.count || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

