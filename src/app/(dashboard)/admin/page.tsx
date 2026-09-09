import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { AdminAlerts } from "@/components/dashboard/admin-alerts";
import { getAdminAlerts, getAdminDashboardStats } from "@/lib/actions/dashboard";
import { getAuditLogs } from "@/lib/actions/audit-logs";
import Link from "next/link";
import {
  Building2,
  Hospital,
  Users,
  Shield,
  Layers,
  Cpu,
  UserPlus,
  ShieldCheck,
  FileSpreadsheet,
  History,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, alerts, auditRes] = await Promise.all([
    getAdminDashboardStats(),
    getAdminAlerts(),
    getAuditLogs({ pageSize: 6 }),
  ]);

  const recentLogs = auditRes.success && auditRes.data ? auditRes.data : [];

  const statCards = [
    {
      title: "Health System",
      value: stats.totalOrganizations.toString(),
      subtitle: "Registered Organization",
      icon: Building2,
      href: "/admin/general",
    },
    {
      title: "Hospital Campuses",
      value: stats.totalHospitals.toString(),
      subtitle: "Active Facilities",
      icon: Hospital,
      href: "/admin/general",
    },
    {
      title: "Active Users",
      value: `${stats.activeUsers} / ${stats.totalUsers}`,
      subtitle: "Active / Total Accounts",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "System Roles",
      value: stats.totalRoles.toString(),
      subtitle: "Configured Roles",
      icon: Shield,
      href: "/admin/roles",
    },
    {
      title: "Departments",
      value: stats.totalDepartments.toString(),
      subtitle: "Operational Units",
      icon: Layers,
      href: "/departments",
    },
    {
      title: "Medical Devices",
      value: stats.totalDevices.toString(),
      subtitle: "Total Registered",
      icon: Cpu,
      href: "/devices",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="System configuration, security governance, and operational health"
      >
        <Button variant="outline" asChild>
          <Link href="/admin/users/invite">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Link>
        </Button>
        <Button asChild>
          <Link href="/admin/general">
            <Building2 className="w-4 h-4 mr-2" />
            General Settings
          </Link>
        </Button>
      </PageHeader>

      {/* ── Actionable Alerts ── */}
      <AdminAlerts alerts={alerts} />

      {/* ── Key System Metrics ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href} className="group">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Recent Activity / Audit Feed ── */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Recent System Audit Activity
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Immutable record of administrative operations (21 CFR Part 11)
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/audit-logs" className="text-xs flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogs.length > 0 ? (
              <div className="divide-y divide-border/60">
                {recentLogs.map((log: any) => {
                  const actorName = log.actorUser?.fullName || log.actorUser?.email || "System";
                  const dateStr = log.timestamp
                    ? new Date(log.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-[10px] uppercase">
                            {log.actionType}
                          </Badge>
                          <span className="text-sm font-medium truncate">{actorName}</span>
                          <span className="text-xs text-muted-foreground">
                            on <span className="font-medium text-foreground">{log.entityType}</span>
                          </span>
                        </div>
                        {log.changeReason && (
                          <p className="text-xs text-muted-foreground italic truncate">
                            Reason: "{log.changeReason}"
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No administrative activity recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Quick Administrative Management ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Administrative Portals
            </CardTitle>
            <p className="text-xs text-muted-foreground">Quick access to core admin functions</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/users"
              className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">User Governance</div>
                <div className="text-xs text-muted-foreground">Manage user accounts, roles & scopes</div>
              </div>
            </Link>

            <Link
              href="/admin/roles"
              className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Roles & Permissions</div>
                <div className="text-xs text-muted-foreground">Verify RBAC and separation of duties</div>
              </div>
            </Link>

            <Link
              href="/admin/general"
              className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">General & Master Data</div>
                <div className="text-xs text-muted-foreground">Health system, hospitals & device catalogs</div>
              </div>
            </Link>

            <Link
              href="/admin/audit-logs"
              className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <History className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Audit Trail</div>
                <div className="text-xs text-muted-foreground">Comprehensive compliance logs</div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
