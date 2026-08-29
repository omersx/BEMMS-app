import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { getOrganizationById } from "@/lib/actions/organizations";
import { notFound } from "next/navigation";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const result = await getOrganizationById(orgId);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const org = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title={org.name} description="Organization details">
        <Button variant="outline" asChild>
          <Link href={`/admin/organizations/${org.id}/edit`}>Edit</Link>
        </Button>
        <Button variant="destructive">Archive</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Code</div>
              <div>{org.code}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="mt-1">
                <StatusBadge status={org.status} />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Timezone</div>
              <div>{org.defaultTimezone}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked Hospitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground mt-1">Total hospitals</p>
            <Button variant="link" className="px-0 mt-4" asChild>
              <Link href={`/admin/hospitals?orgId=${org.id}`}>View Hospitals →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created At</div>
              <div>{new Date(org.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Updated At</div>
              <div>{new Date(org.updatedAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
