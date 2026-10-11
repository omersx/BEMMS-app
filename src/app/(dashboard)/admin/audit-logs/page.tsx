import {
  getAuditLogs,
  getAuditLogEntityTypes,
  getAuditLogActors,
  getAuditLogStats,
  type AuditLogFilters as AuditFiltersType,
} from '@/lib/actions/audit-logs';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditLogFilters } from '@/components/admin/audit-log-filters';
import { AuditLogTable } from '@/components/admin/audit-log-table';
import { AuditLogExport } from '@/components/admin/audit-log-export';
import { Activity, Clock, AlertTriangle, Database } from 'lucide-react';

interface AuditLogsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = await searchParams;

  const search = typeof params.search === 'string' ? params.search : undefined;
  const entityType = typeof params.entityType === 'string' ? params.entityType : undefined;
  const actionType = typeof params.actionType === 'string' ? params.actionType : undefined;
  const actorId = typeof params.actorId === 'string' ? params.actorId : undefined;
  const startDate = typeof params.startDate === 'string' ? params.startDate : undefined;
  const endDate = typeof params.endDate === 'string' ? params.endDate : undefined;
  const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page, 10) || 1) : 1;
  const pageSize = typeof params.pageSize === 'string' ? Math.max(1, parseInt(params.pageSize, 10) || 20) : 20;

  const filters: AuditFiltersType = {
    search,
    entityType,
    actionType,
    actorId,
    startDate,
    endDate,
    page,
    pageSize,
  };

  // Fetch audit logs, distinct entity types, actors, and stats concurrently
  const [logsRes, entityTypesRes, actorsRes, statsRes] = await Promise.all([
    getAuditLogs(filters),
    getAuditLogEntityTypes(),
    getAuditLogActors(),
    getAuditLogStats(),
  ]);

  const logs = logsRes?.success && logsRes.data ? logsRes.data : [];
  const pagination = logsRes?.pagination || {
    page,
    pageSize,
    total: logs.length,
    totalPages: 1,
  };

  const entityTypes = entityTypesRes?.success && entityTypesRes.data ? entityTypesRes.data : [];
  const actors = actorsRes?.success && actorsRes.data ? actorsRes.data : [];
  const stats = statsRes?.success && statsRes.data
    ? statsRes.data
    : { total: 0, last24h: 0, last7d: 0, failedLogins24h: 0 };

  const hasFailedLogins = stats.failedLogins24h > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Comprehensive audit trail and security event logs across system modules"
      >
        <AuditLogExport filters={filters} />
      </PageHeader>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Logs
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All recorded events</p>
          </CardContent>
        </Card>

        {/* Last 24 Hours */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 24 Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last24h.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Recent system activities</p>
          </CardContent>
        </Card>

        {/* Last 7 Days */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 7 Days
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last7d.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Weekly event volume</p>
          </CardContent>
        </Card>

        {/* Failed Logins (24h) */}
        <Card
          className={`border shadow-sm transition-colors ${
            hasFailedLogins
              ? 'border-red-300 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20'
              : ''
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle
              className={`text-sm font-medium ${
                hasFailedLogins ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'
              }`}
            >
              Failed Logins (24h)
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                hasFailedLogins
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                hasFailedLogins ? 'text-red-600 dark:text-red-400' : ''
              }`}
            >
              {stats.failedLogins24h.toLocaleString()}
            </div>
            <p
              className={`text-xs mt-1 ${
                hasFailedLogins
                  ? 'text-red-600/80 dark:text-red-400/80 font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {hasFailedLogins ? 'Attention recommended' : 'No authentication alerts'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters row */}
      <AuditLogFilters
        entityTypes={entityTypes}
        actors={actors}
      />

      {/* Audit Log Table with Pagination */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <AuditLogTable logs={logs} pagination={pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
