import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasRole } from '@/lib/auth/rbac';
import {
  getDashboardStats,
  getMyTickets,
  getDepartmentAlerts,
  getTriageQueue,
  getMyAssignedWork,
  getMaintenanceDueSummary,
  getAwaitingReview,
  getDevicesOutOfService,
  getAdminAlerts,
} from '@/lib/actions/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActionButtons } from '@/components/dashboard/action-buttons';
import { TicketListCompact } from '@/components/dashboard/ticket-list-compact';
import { MaintenanceDueList } from '@/components/dashboard/maintenance-due-list';
import { AvailabilityAlerts } from '@/components/dashboard/availability-alerts';
import { AdminAlerts } from '@/components/dashboard/admin-alerts';
import {
  Monitor, TicketCheck, Wrench, AlertTriangle,
  ShieldAlert, ClipboardCheck, Clock,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as {
    id: string;
    fullName: string;
    roles: string[];
    organizationId: string | null;
  };

  const roles = user.roles || [];
  const firstName = user.fullName?.split(' ')[0] || 'there';

  const isBME = hasRole(roles, 'BIOMED_ENG', 'BIOMED_TECH', 'BIOMED_MGR');
  const isManager = hasRole(roles, 'BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN');
  const isAdmin = hasRole(roles, 'SYS_ADMIN', 'ORG_ADMIN');
  const isStaff = hasRole(roles, 'STAFF', 'DEPT_MGR');

  // Fetch data based on role
  const [stats] = await Promise.all([
    getDashboardStats(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {roles.map(r => r.replace(/_/g, ' ')).join(' · ')}
        </p>
      </div>

      {/* Staff Dashboard */}
      {isStaff && <StaffDashboard stats={stats} userId={user.id} />}

      {/* BME Dashboard */}
      {isBME && !isManager && <BMEDashboard stats={stats} />}

      {/* Manager Dashboard */}
      {isManager && <ManagerDashboard stats={stats} />}

      {/* Admin Dashboard */}
      {isAdmin && <AdminDashboard stats={stats} />}

      {/* Fallback if no specific role matched */}
      {!isStaff && !isBME && !isManager && !isAdmin && (
        <GenericDashboard stats={stats} />
      )}
    </div>
  );
}

// ── Staff Dashboard ─────────────────────────────────────────────────────
async function StaffDashboard({ stats, userId }: { stats: any; userId: string }) {
  const [myTickets, alerts] = await Promise.all([
    getMyTickets(5),
    getDepartmentAlerts(),
  ]);

  return (
    <>
      {/* Quick Actions - full width on mobile */}
      <ActionButtons role="staff" />

      {/* Department Availability Alerts */}
      {alerts.length > 0 && (
        <AvailabilityAlerts devices={alerts} />
      )}

      {/* My Tickets */}
      <TicketListCompact
        tickets={myTickets}
        title="My Tickets"
        emptyMessage="No tickets need your attention."
      />

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value={stats?.openTickets || 0}
          icon={<TicketCheck className="h-4 w-4 text-orange-500" />}
          href="/tickets?status=open"
        />
        <StatCard
          title="Devices Available"
          value={stats?.activeDevices || 0}
          icon={<Monitor className="h-4 w-4 text-green-500" />}
          href="/devices?status=operational"
        />
      </div>
    </>
  );
}

// ── BME Dashboard ────────────────────────────────────────────────────────
async function BMEDashboard({ stats }: { stats: any }) {
  const [triage, assigned, maintenanceDue, review, outOfService] =
    await Promise.all([
      getTriageQueue(5),
      getMyAssignedWork(5),
      getMaintenanceDueSummary(),
      getAwaitingReview(5),
      getDevicesOutOfService(5),
    ]);

  return (
    <>
      {/* Critical alert cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {(stats?.criticalTickets || 0) > 0 && (
          <StatCard
            title="Critical Tickets"
            value={stats.criticalTickets}
            icon={<ShieldAlert className="h-4 w-4 text-red-500" />}
            href="/tickets?priority=p1_critical"
          />
        )}
        <StatCard
          title="Untriaged"
          value={triage.length}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          href="/tickets/triage"
        />
        <StatCard
          title="Due / Overdue"
          value={`${maintenanceDue.due_today + maintenanceDue.overdue}`}
          icon={<Clock className={`h-4 w-4 ${maintenanceDue.overdue > 0 ? 'text-red-500' : 'text-yellow-500'}`} />}
          href="/maintenance/tasks?due=today"
          trend={maintenanceDue.overdue > 0 ? `${maintenanceDue.overdue} overdue` : undefined}
        />
        <StatCard
          title="Out of Service"
          value={stats?.outOfService || 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          href="/devices?status=out_of_service"
        />
      </div>

      {/* Quick Actions */}
      <ActionButtons role="bme" triageCount={triage.length} />

      {/* Assigned Work */}
      <TicketListCompact
        tickets={assigned
          .filter((a) => a.type === 'ticket')
          .map((a) => ({
            id: a.id,
            ticketNumber: a.number,
            title: a.title,
            statusCode: a.statusCode,
            priorityCode: a.priorityCode,
            reportedAt: a.date || new Date(),
            deviceName: a.deviceName,
          }))}
        title="My Assigned Tickets"
        emptyMessage="No assigned tickets."
      />

      {/* Maintenance Due */}
      <MaintenanceDueList
        tasks={assigned
          .filter((a) => a.type === 'task')
          .map((a) => ({
            id: a.id,
            taskNumber: a.number,
            title: a.title,
            statusCode: a.statusCode,
            dueDate: a.date || null,
            deviceName: a.deviceName,
            maintenanceType: 'preventive_maintenance',
          }))}
        title="My Maintenance Tasks"
      />

      {/* Awaiting Review */}
      {review.length > 0 && (
        <MaintenanceDueList
          tasks={review}
          title={`Awaiting Review (${review.length})`}
        />
      )}

      {/* Out of Service Devices */}
      {outOfService.length > 0 && (
        <AvailabilityAlerts devices={outOfService} />
      )}
    </>
  );
}

// ── Manager Dashboard ────────────────────────────────────────────────────
async function ManagerDashboard({ stats }: { stats: any }) {
  const [triage, review, maintenanceDue, outOfService] = await Promise.all([
    getTriageQueue(5),
    getAwaitingReview(5),
    getMaintenanceDueSummary(),
    getDevicesOutOfService(10),
  ]);

  const complianceRate = stats?.pmComplianceRate || 100;

  return (
    <>
      {/* Exception-first metric cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Critical Tickets"
          value={stats?.criticalTickets || 0}
          icon={<ShieldAlert className="h-4 w-4 text-red-500" />}
          href="/tickets?priority=p1_critical"
        />
        <StatCard
          title="Overdue Maintenance"
          value={maintenanceDue.overdue}
          icon={<Clock className={`h-4 w-4 ${maintenanceDue.overdue > 0 ? 'text-red-500' : 'text-green-500'}`} />}
          href="/maintenance/tasks?due=overdue"
        />
        <StatCard
          title="Out of Service"
          value={stats?.outOfService || 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          href="/devices?status=out_of_service"
        />
        <StatCard
          title="PM Compliance"
          value={`${complianceRate}%`}
          icon={<ClipboardCheck className={`h-4 w-4 ${complianceRate >= 90 ? 'text-green-500' : 'text-amber-500'}`} />}
          href="/reports/maintenance"
        />
      </div>

      {/* Overall stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={stats?.totalDevices || 0}
          icon={<Monitor className="h-4 w-4 text-blue-500" />}
          href="/devices"
        />
        <StatCard
          title="Open Tickets"
          value={stats?.openTickets || 0}
          icon={<TicketCheck className="h-4 w-4 text-orange-500" />}
          href="/tickets?status=open"
        />
        <StatCard
          title="Untriaged"
          value={triage.length}
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          href="/tickets/triage"
        />
        <StatCard
          title="Awaiting Review"
          value={review.length}
          icon={<Wrench className="h-4 w-4 text-purple-500" />}
          href="/maintenance/tasks?status=awaiting_review"
        />
      </div>

      {/* Triage Queue */}
      {triage.length > 0 && (
        <TicketListCompact
          tickets={triage}
          title="Triage Queue"
          emptyMessage="All tickets have been triaged."
        />
      )}

      {/* Awaiting Review */}
      {review.length > 0 && (
        <MaintenanceDueList
          tasks={review}
          title="Awaiting Review / Release"
        />
      )}

      {/* Out of Service */}
      {outOfService.length > 0 && (
        <AvailabilityAlerts devices={outOfService} />
      )}
    </>
  );
}

// ── Admin Dashboard ──────────────────────────────────────────────────────
async function AdminDashboard({ stats }: { stats: any }) {
  const adminAlerts = await getAdminAlerts();

  return (
    <>
      {/* Admin Alerts */}
      <AdminAlerts alerts={adminAlerts} />

      {/* System Overview */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={stats?.totalDevices || 0}
          icon={<Monitor className="h-4 w-4 text-blue-500" />}
          href="/devices"
        />
        <StatCard
          title="Open Tickets"
          value={stats?.openTickets || 0}
          icon={<TicketCheck className="h-4 w-4 text-orange-500" />}
          href="/tickets"
        />
        <StatCard
          title="Out of Service"
          value={stats?.outOfService || 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          href="/devices?status=out_of_service"
        />
        <StatCard
          title="PM Compliance"
          value={`${stats?.pmComplianceRate || 100}%`}
          icon={<ClipboardCheck className="h-4 w-4 text-green-500" />}
          href="/reports/maintenance"
        />
      </div>

      {/* Quick Actions */}
      <ActionButtons role="admin" />
    </>
  );
}

// ── Generic Fallback ─────────────────────────────────────────────────────
function GenericDashboard({ stats }: { stats: any }) {
  return (
    <>
      <ActionButtons role="staff" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={stats?.totalDevices || 0}
          icon={<Monitor className="h-4 w-4 text-blue-500" />}
          href="/devices"
        />
        <StatCard
          title="Open Tickets"
          value={stats?.openTickets || 0}
          icon={<TicketCheck className="h-4 w-4 text-orange-500" />}
          href="/tickets"
        />
      </div>
    </>
  );
}