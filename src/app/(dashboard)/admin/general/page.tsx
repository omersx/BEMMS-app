import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganizations } from "@/lib/actions/organizations";
import { getHospitals } from "@/lib/actions/hospitals";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Building2, Hospital, Plus, Eye, Edit, Globe, Calendar, ShieldCheck } from "lucide-react";
import { hasRole } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminGeneralPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { roles?: string[] };
  const isSysAdmin = hasRole(user.roles || [], "SYS_ADMIN");

  const [orgsResult, hospitalsResult] = await Promise.all([
    getOrganizations(),
    getHospitals(),
  ]);

  const organizations = orgsResult.success && orgsResult.data ? orgsResult.data : [];
  const hospitals = hospitalsResult.success && hospitalsResult.data ? hospitalsResult.data : [];

  const currentOrg = organizations[0]; // Primary organization

  const hospitalColumns = [
    {
      key: "code",
      header: "Code",
      render: (item: any) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {item.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Hospital Name",
      render: (item: any) => (
        <Link
          href={`/admin/hospitals/${item.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {item.name}
        </Link>
      ),
    },
    {
      key: "city",
      header: "City / Campus",
      render: (item: any) => item.city || item.address || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/hospitals/${item.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/hospitals/${item.id}/edit`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="General Settings"
        description="Manage your health system organization and hospital facilities"
      />

      {/* ── Section 1: Health System Organization ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Organization Profile</h2>
          </div>
          {isSysAdmin && (
            <div className="flex gap-2">
              {organizations.length > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/organizations">Switch Organization</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/organizations/new">
                  <Plus className="w-4 h-4 mr-1" />
                  New Organization
                </Link>
              </Button>
            </div>
          )}
        </div>

        {currentOrg ? (
          <Card className="border shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold">{currentOrg.name}</h3>
                      <Badge variant="outline" className="font-mono text-xs">
                        {currentOrg.code}
                      </Badge>
                      <StatusBadge status={currentOrg.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        Timezone: {currentOrg.defaultTimezone || "UTC"}
                      </span>
                      {currentOrg.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Created: {new Date(currentOrg.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/organizations/${currentOrg.id}/edit`}>
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No organization profile registered.
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Section 2: Hospital Facilities ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hospital className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Hospital Facilities & Campuses</h2>
            <Badge variant="secondary" className="text-xs">
              {hospitals.length}
            </Badge>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/hospitals/new">
              <Plus className="w-4 h-4 mr-1" />
              Add Hospital
            </Link>
          </Button>
        </div>

        <DataTable
          columns={hospitalColumns}
          data={hospitals}
          searchable
          searchPlaceholder="Search hospitals by name, code, city..."
          emptyMessage="No hospital facilities configured yet."
        />
      </div>
    </div>
  );
}
