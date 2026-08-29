import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import Link from "next/link";
import { getHospitalById } from "@/lib/actions/hospitals";
import { notFound } from "next/navigation";

export default async function HospitalDetailPage({ params }: { params: Promise<{ hospitalId: string }> }) {
  const { hospitalId } = await params;
  const result = await getHospitalById(hospitalId);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const hospital = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title={hospital.name} description="Hospital details">
        <Button variant="outline" asChild>
          <Link href={`/admin/hospitals/${hospital.id}/edit`}>Edit</Link>
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
              <div>{hospital.code}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Organization</div>
              <div>{(hospital as any).organizationName || hospital.organizationId}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="mt-1">
                <StatusBadge status={hospital.status} />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Timezone</div>
              <div>{hospital.timezone}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Address</div>
              <div>{hospital.address}</div>
              <div>{hospital.city}, {hospital.country}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Phone</div>
              <div>{hospital.phone || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div>{hospital.email || "N/A"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created At</div>
              <div>{new Date(hospital.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Updated At</div>
              <div>{new Date(hospital.updatedAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
