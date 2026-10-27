'use server';

import { db } from '@/lib/db';
import {
  engineerRounds, roundDepartmentVisits, roundVisitNotes,
  engineerProfiles, departments, users, organizations,
  hospitals, devices, serviceTickets, electronicSignatures, recordVersions,
} from '@/lib/db/schema';
import { requireAuth, requireRole, hasRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import {
  startRoundSchema, completeDepartmentVisitSchema, addVisitNoteSchema,
  completeRoundSchema, roundHistoryFilterSchema, roundCalendarQuerySchema,
} from '@/lib/validators/engineer-rounds';
import { systemSettingsSchema } from '@/lib/validators/system-settings';
import { eq, and, desc, asc, sql, count, between, inArray, gte, lte } from 'drizzle-orm';
import { verifySignatureAuth } from './signature-auth';

// ── Helper: Check if Engineer's Round feature is enabled ────────────────────────

export async function isEngineerRoundEnabled(orgId?: string): Promise<boolean> {
  try {
    const session = await requireAuth();
    const targetOrgId = orgId || session.organizationId;
    if (!targetOrgId) return false;

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, targetOrgId),
    });
    if (!org) return false;

    const parsed = systemSettingsSchema.safeParse(org.settings || {});
    if (!parsed.success) return false;

    return parsed.data.features?.engineerRoundEnabled ?? false;
  } catch {
    return false;
  }
}

// ── Helper: Get engineer profile with covered departments ───────────────────────

async function getEngineerProfile(userId: string) {
  return db.query.engineerProfiles.findFirst({
    where: eq(engineerProfiles.userId, userId),
    with: {
      hospital: true,
    },
  });
}

// ── Helper: Get today's date as YYYY-MM-DD ──────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Get Today's Round (or create scheduled one) ─────────────────────────────────

export async function getTodayRound() {
  const session = await requireAuth();
  const enabled = await isEngineerRoundEnabled();
  if (!enabled) {
    return { success: false, error: 'Engineer\'s Round feature is not enabled' };
  }

  const today = getTodayDate();

  try {
    // Check if a round already exists for today
    const existingRound = await db.query.engineerRounds.findFirst({
      where: and(
        eq(engineerRounds.engineerId, session.id),
        eq(engineerRounds.roundDate, today),
      ),
      with: {
        hospital: true,
        departmentVisits: {
          with: {
            notes: {
              with: {
                author: { columns: { id: true, fullName: true } },
              },
            },
            department: { columns: { id: true, name: true, code: true } },
          },
          orderBy: [asc(roundDepartmentVisits.sequence)],
        },
        engineer: { columns: { id: true, fullName: true } },
      },
    });

    if (existingRound) {
      // Count linked tickets for each visit
      const visitIds = existingRound.departmentVisits.map(v => v.id);
      let ticketCounts: Record<string, number> = {};

      if (visitIds.length > 0) {
        const tickets = await db
          .select({
            roundVisitId: serviceTickets.roundVisitId,
            count: count(),
          })
          .from(serviceTickets)
          .where(inArray(serviceTickets.roundVisitId, visitIds))
          .groupBy(serviceTickets.roundVisitId);

        ticketCounts = Object.fromEntries(
          tickets.map(t => [t.roundVisitId, Number(t.count)])
        );
      }

      return {
        success: true,
        data: {
          ...existingRound,
          departmentVisits: existingRound.departmentVisits.map(v => ({
            ...v,
            ticketCount: ticketCounts[v.id] || 0,
          })),
        },
      };
    }

    // No round exists — get engineer profile to determine if they should have one
    const profile = await getEngineerProfile(session.id);
    if (!profile) {
      return { success: false, error: 'Engineer profile not found. Please set up your profile first.' };
    }

    // Check if today is a working day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay = dayNames[new Date().getDay()];
    const workingDays = (profile.workingDays as string[]) || [];

    if (!workingDays.includes(todayDay)) {
      return {
        success: true,
        data: null,
        isOffDay: true,
        message: 'Today is not a scheduled working day',
      };
    }

    // Get covered departments
    const coveredDeptIds = (profile.coveredDepartmentIds as string[]) || [];
    if (coveredDeptIds.length === 0) {
      return {
        success: false,
        error: 'No departments assigned to your profile. Please contact your manager.',
      };
    }

    // Fetch department details
    const deptList = await db.query.departments.findMany({
      where: and(
        inArray(departments.id, coveredDeptIds),
        eq(departments.status, 'active'),
      ),
      columns: { id: true, name: true, code: true },
    });

    return {
      success: true,
      data: null,
      canStart: true,
      hospitalId: profile.hospitalId,
      hospitalName: profile.hospital?.name,
      departments: deptList,
      shiftType: inferShiftType(),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Start Round ─────────────────────────────────────────────────────────────────

export async function startRound(input: unknown) {
  const session = await requireAuth();
  await requireRole('BIOMED_ENG', 'BIOMED_TECH', 'BIOMED_MGR');

  const enabled = await isEngineerRoundEnabled();
  if (!enabled) {
    return { success: false, error: 'Engineer\'s Round feature is not enabled' };
  }

  const validated = startRoundSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { hospitalId, shiftType, password } = validated.data;
  const today = getTodayDate();

  // Check for existing round today
  const existing = await db.query.engineerRounds.findFirst({
    where: and(
      eq(engineerRounds.engineerId, session.id),
      eq(engineerRounds.roundDate, today),
    ),
  });

  if (existing && existing.status !== 'scheduled') {
    return { success: false, error: 'A round already exists for today' };
  }

  // Verify signature (password re-auth)
  const authResult = await verifySignatureAuth(session.id, password);
  if (!authResult.success) {
    return { success: false, error: 'Signature verification failed: ' + authResult.error };
  }

  // Get engineer profile for departments
  const profile = await getEngineerProfile(session.id);
  if (!profile) {
    return { success: false, error: 'Engineer profile not found' };
  }

  const coveredDeptIds = (profile.coveredDepartmentIds as string[]) || [];
  if (coveredDeptIds.length === 0) {
    return { success: false, error: 'No departments assigned to your profile' };
  }

  // Fetch active departments
  const deptList = await db.query.departments.findMany({
    where: and(
      inArray(departments.id, coveredDeptIds),
      eq(departments.status, 'active'),
    ),
    columns: { id: true, name: true },
  });

  try {
    const result = await db.transaction(async (tx) => {
      const roundId = existing?.id || crypto.randomUUID();

      // Create the e-signature record version
      const contentSnapshot = {
        action: 'start_engineer_round',
        engineerId: session.id,
        engineerName: session.fullName,
        roundDate: today,
        shiftType,
        hospitalId,
        departments: deptList.map(d => d.name),
        signedAt: new Date().toISOString(),
      };

      const { createHash } = await import('crypto');
      const contentHash = createHash('sha256')
        .update(JSON.stringify(contentSnapshot))
        .digest('hex');

      const [recordVersion] = await tx.insert(recordVersions).values({
        organizationId: session.organizationId!,
        entityType: 'engineer_round',
        entityId: roundId,
        versionNumber: 1,
        canonicalSnapshotJsonb: contentSnapshot,
        contentHashSha256: contentHash,
        createdByUserId: session.id,
      }).returning();

      const [signature] = await tx.insert(electronicSignatures).values({
        organizationId: session.organizationId!,
        recordVersionId: recordVersion.id,
        entityType: 'engineer_round',
        entityId: roundId,
        signaturePurpose: 'perform',
        signerUserId: session.id,
        signerNameSnapshot: session.fullName || 'Unknown',
        signerRoleSnapshot: 'BIOMED_ENG',
        attestationTextVersion: 'I confirm the start of this daily engineering round.',
        authMethod: 'password_reauth',
        signedAt: new Date(),
        signedContentHashSha256: contentHash,
      }).returning();

      // Create or update the round
      if (existing) {
        await tx.update(engineerRounds)
          .set({
            status: 'in_progress',
            startedAt: new Date(),
            startSignatureId: signature.id,
            totalDepartments: deptList.length,
            updatedAt: new Date(),
          })
          .where(eq(engineerRounds.id, existing.id));
      } else {
        await tx.insert(engineerRounds).values({
          id: roundId,
          organizationId: session.organizationId!,
          hospitalId,
          engineerId: session.id,
          roundDate: today,
          shiftType,
          status: 'in_progress',
          startedAt: new Date(),
          startSignatureId: signature.id,
          totalDepartments: deptList.length,
        });
      }

      // Create department visit entries
      const visitValues = deptList.map((dept, idx) => ({
        roundId,
        departmentId: dept.id,
        departmentName: dept.name,
        sequence: idx + 1,
        status: 'pending' as const,
      }));

      await tx.insert(roundDepartmentVisits).values(visitValues);

      // Audit log
      await createAuditLog(tx, {
        action: 'CREATE',
        entityType: 'engineer_round',
        entityId: roundId,
        actorUserId: session.id,
        organizationId: session.organizationId!,
        hospitalId,
        newState: {
          roundDate: today,
          shiftType,
          departments: deptList.map(d => d.name),
          signatureId: signature.id,
        },
        changeReason: 'Engineer started daily round with electronic signature',
      });

      return { roundId, signatureId: signature.id };
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Complete Department Visit ────────────────────────────────────────────────────

export async function completeDepartmentVisit(input: unknown) {
  const session = await requireAuth();

  const validated = completeDepartmentVisitSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { visitId, noteText, deviceMentions } = validated.data;

  try {
    // Verify visit belongs to the current engineer's active round
    const visit = await db.query.roundDepartmentVisits.findFirst({
      where: eq(roundDepartmentVisits.id, visitId),
      with: {
        round: { columns: { id: true, engineerId: true, status: true } },
      },
    });

    if (!visit) {
      return { success: false, error: 'Department visit not found' };
    }
    if (visit.round.engineerId !== session.id) {
      return { success: false, error: 'This visit does not belong to your round' };
    }
    if (visit.round.status !== 'in_progress') {
      return { success: false, error: 'Round is not in progress' };
    }
    if (visit.status === 'completed') {
      return { success: false, error: 'This department visit is already completed' };
    }

    const result = await db.transaction(async (tx) => {
      const now = new Date();

      // Mark visit as completed
      await tx.update(roundDepartmentVisits)
        .set({
          status: 'completed',
          startedAt: visit.startedAt || now,
          completedAt: now,
        })
        .where(eq(roundDepartmentVisits.id, visitId));

      // Add note if provided
      if (noteText && noteText.trim()) {
        await tx.insert(roundVisitNotes).values({
          visitId,
          authorId: session.id,
          noteText: noteText.trim(),
          deviceMentions: deviceMentions || [],
        });

        // Increment note count on round
        await tx.update(engineerRounds)
          .set({
            totalNotes: sql`${engineerRounds.totalNotes} + 1`,
            updatedAt: now,
          })
          .where(eq(engineerRounds.id, visit.round.id));
      }

      // Increment completed department count
      await tx.update(engineerRounds)
        .set({
          completedDepartments: sql`${engineerRounds.completedDepartments} + 1`,
          updatedAt: now,
        })
        .where(eq(engineerRounds.id, visit.round.id));

      return { visitId, completedAt: now };
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Add Note to Visit ───────────────────────────────────────────────────────────

export async function addVisitNote(input: unknown) {
  const session = await requireAuth();

  const validated = addVisitNoteSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { visitId, noteText, deviceMentions } = validated.data;

  try {
    const visit = await db.query.roundDepartmentVisits.findFirst({
      where: eq(roundDepartmentVisits.id, visitId),
      with: {
        round: { columns: { id: true, engineerId: true, status: true } },
      },
    });

    if (!visit) {
      return { success: false, error: 'Visit not found' };
    }
    if (visit.round.engineerId !== session.id) {
      return { success: false, error: 'This visit does not belong to your round' };
    }

    const [note] = await db.insert(roundVisitNotes).values({
      visitId,
      authorId: session.id,
      noteText: noteText.trim(),
      deviceMentions: deviceMentions || [],
    }).returning();

    // Increment note count
    await db.update(engineerRounds)
      .set({
        totalNotes: sql`${engineerRounds.totalNotes} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(engineerRounds.id, visit.round.id));

    return { success: true, data: note };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Complete Round ──────────────────────────────────────────────────────────────

export async function completeRound(input: unknown) {
  const session = await requireAuth();

  const validated = completeRoundSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { roundId } = validated.data;

  try {
    const round = await db.query.engineerRounds.findFirst({
      where: eq(engineerRounds.id, roundId),
      with: {
        departmentVisits: { columns: { id: true, status: true } },
      },
    });

    if (!round) {
      return { success: false, error: 'Round not found' };
    }
    if (round.engineerId !== session.id) {
      return { success: false, error: 'This is not your round' };
    }
    if (round.status !== 'in_progress') {
      return { success: false, error: 'Round is not in progress' };
    }

    const now = new Date();
    const completedCount = round.departmentVisits.filter(v => v.status === 'completed').length;
    const pendingVisits = round.departmentVisits.filter(v => v.status === 'pending');

    // Count linked tickets
    const ticketResult = await db
      .select({ count: count() })
      .from(serviceTickets)
      .where(eq(serviceTickets.roundVisitId, roundId));
    // Actually count tickets linked to any visit in this round
    const visitIds = round.departmentVisits.map(v => v.id);
    let totalTickets = 0;
    if (visitIds.length > 0) {
      const [tc] = await db
        .select({ count: count() })
        .from(serviceTickets)
        .where(inArray(serviceTickets.roundVisitId, visitIds));
      totalTickets = Number(tc?.count || 0);
    }

    const result = await db.transaction(async (tx) => {
      // Mark remaining pending visits as skipped
      if (pendingVisits.length > 0) {
        await tx.update(roundDepartmentVisits)
          .set({ status: 'skipped' })
          .where(
            and(
              eq(roundDepartmentVisits.roundId, roundId),
              eq(roundDepartmentVisits.status, 'pending'),
            )
          );
      }

      // Complete the round
      await tx.update(engineerRounds)
        .set({
          status: 'completed',
          completedAt: now,
          completedDepartments: completedCount,
          totalIssuesReported: totalTickets,
          updatedAt: now,
        })
        .where(eq(engineerRounds.id, roundId));

      // Audit log
      await createAuditLog(tx, {
        action: 'UPDATE',
        entityType: 'engineer_round',
        entityId: roundId,
        actorUserId: session.id,
        organizationId: round.organizationId,
        hospitalId: round.hospitalId,
        newState: {
          status: 'completed',
          completedDepartments: completedCount,
          totalDepartments: round.totalDepartments,
          totalIssuesReported: totalTickets,
          skippedDepartments: pendingVisits.length,
        },
        changeReason: 'Engineer completed daily round',
      });

      return {
        roundId,
        completedAt: now,
        completedDepartments: completedCount,
        totalDepartments: round.totalDepartments,
        skippedDepartments: pendingVisits.length,
        totalIssuesReported: totalTickets,
      };
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Round Detail ────────────────────────────────────────────────────────────

export async function getRoundDetail(roundId: string) {
  const session = await requireAuth();

  try {
    const round = await db.query.engineerRounds.findFirst({
      where: eq(engineerRounds.id, roundId),
      with: {
        hospital: { columns: { id: true, name: true } },
        engineer: { columns: { id: true, fullName: true } },
        startSignature: {
          columns: { id: true, signedAt: true, signerNameSnapshot: true },
        },
        departmentVisits: {
          with: {
            department: { columns: { id: true, name: true, code: true } },
            notes: {
              with: {
                author: { columns: { id: true, fullName: true } },
              },
              orderBy: [asc(roundVisitNotes.createdAt)],
            },
          },
          orderBy: [asc(roundDepartmentVisits.sequence)],
        },
      },
    });

    if (!round) {
      return { success: false, error: 'Round not found' };
    }

    // Check access: own round or manager/admin
    const isOwn = round.engineerId === session.id;
    const isManager = hasRole(session.roles, 'BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN', 'SYS_ADMIN');
    if (!isOwn && !isManager) {
      return { success: false, error: 'Access denied' };
    }

    // Get ticket counts per visit
    const visitIds = round.departmentVisits.map(v => v.id);
    const ticketsByVisit: Record<string, any[]> = {};

    if (visitIds.length > 0) {
      const tickets = await db
        .select({
          roundVisitId: serviceTickets.roundVisitId,
          ticketNumber: serviceTickets.ticketNumber,
          title: serviceTickets.title,
          priorityCode: serviceTickets.priorityCode,
          statusCode: serviceTickets.statusCode,
        })
        .from(serviceTickets)
        .where(inArray(serviceTickets.roundVisitId, visitIds));

      for (const ticket of tickets) {
        if (ticket.roundVisitId) {
          if (!ticketsByVisit[ticket.roundVisitId]) ticketsByVisit[ticket.roundVisitId] = [];
          ticketsByVisit[ticket.roundVisitId].push(ticket);
        }
      }
    }

    return {
      success: true,
      data: {
        ...round,
        departmentVisits: round.departmentVisits.map(v => ({
          ...v,
          tickets: ticketsByVisit[v.id] || [],
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Round History ───────────────────────────────────────────────────────────────

export async function getRoundHistory(input: unknown) {
  const session = await requireAuth();

  const validated = roundHistoryFilterSchema.safeParse(input || {});
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { hospitalId, engineerId, status, dateFrom, dateTo, page, pageSize } = validated.data;

  try {
    const isManager = hasRole(session.roles, 'BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN', 'SYS_ADMIN');
    const targetEngineerId = isManager ? (engineerId || undefined) : session.id;

    const conditions = [];
    if (session.organizationId) {
      conditions.push(eq(engineerRounds.organizationId, session.organizationId));
    }
    if (targetEngineerId) {
      conditions.push(eq(engineerRounds.engineerId, targetEngineerId));
    }
    if (hospitalId) {
      conditions.push(eq(engineerRounds.hospitalId, hospitalId));
    }
    if (status) {
      conditions.push(eq(engineerRounds.status, status));
    }
    if (dateFrom) {
      conditions.push(gte(engineerRounds.roundDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(engineerRounds.roundDate, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * pageSize;

    const [rounds, [totalResult]] = await Promise.all([
      db.query.engineerRounds.findMany({
        where: whereClause,
        with: {
          hospital: { columns: { id: true, name: true } },
          engineer: { columns: { id: true, fullName: true } },
        },
        orderBy: [desc(engineerRounds.roundDate), desc(engineerRounds.createdAt)],
        limit: pageSize,
        offset,
      }),
      db.select({ count: count() })
        .from(engineerRounds)
        .where(whereClause),
    ]);

    return {
      success: true,
      data: rounds,
      pagination: {
        page,
        pageSize,
        total: Number(totalResult?.count || 0),
        totalPages: Math.ceil(Number(totalResult?.count || 0) / pageSize),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Calendar Data (GitHub contributions style) ──────────────────────────────────

export async function getRoundCalendarData(input: unknown) {
  const session = await requireAuth();

  const validated = roundCalendarQuerySchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.message };
  }

  const { engineerId, month, year } = validated.data;

  // Access check
  const isManager = hasRole(session.roles, 'BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN', 'SYS_ADMIN');
  if (engineerId !== session.id && !isManager) {
    return { success: false, error: 'Access denied' };
  }

  try {
    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Get all rounds for this month
    const rounds = await db.query.engineerRounds.findMany({
      where: and(
        eq(engineerRounds.engineerId, engineerId),
        gte(engineerRounds.roundDate, startDate),
        lte(engineerRounds.roundDate, endDate),
      ),
      columns: {
        id: true,
        roundDate: true,
        status: true,
        totalDepartments: true,
        completedDepartments: true,
        totalIssuesReported: true,
        totalNotes: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: [asc(engineerRounds.roundDate)],
    });

    // Get engineer's working days
    const profile = await getEngineerProfile(engineerId);
    const workingDays = (profile?.workingDays as string[]) || [];

    // Build calendar data
    const calendarDays = [];
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, day);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dateObj.getDay()];
      const isWorkingDay = workingDays.includes(dayName);
      const round = rounds.find(r => r.roundDate === dateStr);

      let status: 'completed' | 'partial' | 'missed' | 'in_progress' | 'scheduled' | 'off_day';
      if (!isWorkingDay) {
        status = 'off_day';
      } else if (round) {
        if (round.status === 'completed') {
          status = round.completedDepartments < round.totalDepartments ? 'partial' : 'completed';
        } else if (round.status === 'in_progress') {
          status = 'in_progress';
        } else if (round.status === 'missed') {
          status = 'missed';
        } else if (round.status === 'scheduled') {
          status = 'scheduled';
        } else {
          status = 'missed';
        }
      } else {
        // Working day with no round
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = dateObj < today;
        status = isPast ? 'missed' : 'scheduled';
      }

      calendarDays.push({
        date: dateStr,
        day,
        dayName,
        isWorkingDay,
        status,
        round: round || null,
      });
    }

    // Summary stats
    const workingDayCount = calendarDays.filter(d => d.isWorkingDay).length;
    const completedCount = calendarDays.filter(d => d.status === 'completed' || d.status === 'partial').length;
    const missedCount = calendarDays.filter(d => d.status === 'missed').length;

    return {
      success: true,
      data: {
        month,
        year,
        engineerId,
        workingDays,
        calendarDays,
        summary: {
          totalWorkingDays: workingDayCount,
          completed: completedCount,
          missed: missedCount,
          complianceRate: workingDayCount > 0
            ? Math.round((completedCount / workingDayCount) * 100)
            : 0,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Manager: Get Team Round Compliance ──────────────────────────────────────────

export async function getTeamRoundCompliance(dateStr?: string) {
  const session = await requireAuth();
  await requireRole('BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN', 'SYS_ADMIN');

  const targetDate = dateStr || getTodayDate();

  try {
    // Get all engineers in the organization
    const profiles = await db.query.engineerProfiles.findMany({
      where: session.organizationId
        ? eq(engineerProfiles.organizationId, session.organizationId)
        : undefined,
      with: {
        user: { columns: { id: true, fullName: true } },
        hospital: { columns: { id: true, name: true } },
      },
    });

    // Get all rounds for the target date
    const rounds = await db.query.engineerRounds.findMany({
      where: and(
        eq(engineerRounds.roundDate, targetDate),
        session.organizationId
          ? eq(engineerRounds.organizationId, session.organizationId)
          : undefined,
      ),
    });

    const roundsByEngineer = Object.fromEntries(
      rounds.map(r => [r.engineerId, r])
    );

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDayName = dayNames[new Date(targetDate + 'T00:00:00').getDay()];

    const team = profiles.map(p => {
      const workingDays = (p.workingDays as string[]) || [];
      const isWorkingDay = workingDays.includes(targetDayName);
      const round = roundsByEngineer[p.userId];

      let status: string;
      if (!isWorkingDay) {
        status = 'off_duty';
      } else if (round) {
        status = round.status;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = new Date(targetDate + 'T00:00:00') < today;
        status = isPast ? 'missed' : 'pending';
      }

      return {
        engineerId: p.userId,
        engineerName: p.user?.fullName || 'Unknown',
        hospitalName: p.hospital?.name || 'Unknown',
        isWorkingDay,
        status,
        round: round || null,
      };
    });

    const scheduledEngineers = team.filter(t => t.isWorkingDay);
    const completedEngineers = team.filter(t => t.status === 'completed');

    return {
      success: true,
      data: {
        date: targetDate,
        team,
        summary: {
          totalEngineers: profiles.length,
          scheduledToday: scheduledEngineers.length,
          completed: completedEngineers.length,
          inProgress: team.filter(t => t.status === 'in_progress').length,
          missed: team.filter(t => t.status === 'missed').length,
          offDuty: team.filter(t => !t.isWorkingDay).length,
          complianceRate: scheduledEngineers.length > 0
            ? Math.round((completedEngineers.length / scheduledEngineers.length) * 100)
            : 100,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Devices by Department (for @mention) ────────────────────────────────────

export async function getDepartmentDevices(departmentId: string) {
  const session = await requireAuth();

  try {
    const deviceList = await db.query.devices.findMany({
      where: and(
        eq(devices.departmentId, departmentId),
        eq(devices.lifecycleStatus, 'active'),
      ),
      columns: {
        id: true,
        name: true,
        internalCode: true,
        assetNumber: true,
        currentStatusCode: true,
      },
      orderBy: [asc(devices.name)],
    });

    return { success: true, data: deviceList };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Helper: Infer shift type from current time ──────────────────────────────────

function inferShiftType(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'evening';
  return 'night';
}
