'use server';

import { db } from '@/lib/db';
import { generatedReports } from '@/lib/db/schema/report-history';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { eq, and, desc } from 'drizzle-orm';

export async function saveReportToHistory(params: {
  reportType: string;
  title: string;
  filters: any;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  timezone?: string;
  rowCount?: number;
  fileFormat?: string;
  fileName: string;
}) {
  const user = await requireAuth();
  
  const [report] = await db.insert(generatedReports).values({
    organizationId: user.organizationId,
    reportType: params.reportType,
    title: params.title,
    filtersJsonb: params.filters,
    dateRangeStart: params.dateRangeStart,
    dateRangeEnd: params.dateRangeEnd,
    timezone: params.timezone || 'UTC',
    rowCount: params.rowCount,
    fileFormat: params.fileFormat || 'csv',
    fileName: params.fileName,
    generatedByUserId: user.id,
  }).returning();
  
  return report;
}

export async function getReportHistory() {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  
  return db.query.generatedReports.findMany({
    where: eq(generatedReports.organizationId, user.organizationId),
    orderBy: [desc(generatedReports.generatedAt)],
    with: {
      generatedByUser: {
        columns: { id: true, fullName: true, email: true }
      }
    },
    limit: 100
  });
}

export async function getReportById(id: string) {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  
  const report = await db.query.generatedReports.findFirst({
    where: and(
      eq(generatedReports.id, id),
      eq(generatedReports.organizationId, user.organizationId)
    ),
    with: {
      generatedByUser: {
        columns: { id: true, fullName: true, email: true }
      }
    }
  });
  
  return report;
}
