import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getHospitals } from "@/lib/actions/hospitals";

export default async function HospitalsPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const { orgId } = await searchParams;
  const result = await getHospitals(orgId);
  const hospitals = result.success && result.data ? result.data : [];

  const columns = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "organizationName", header: "Organization", render: (item: any) => item.organizationName || item.organizationId },
    { key: "city", header: "City" },
    { 
      key: "status", 
      header: "Status",
      render: (item: any) => <StatusBadge status={item.status} />
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/hospitals/${item.id}`}>View</Link>
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Hospitals" description="Manage all hospitals in the platform">
        <Button asChild>
          <Link href="/admin/hospitals/new">Add Hospital</Link>
        </Button>
      </PageHeader>
      
      <DataTable 
        columns={columns} 
        data={hospitals} 
        searchable 
        searchPlaceholder="Search hospitals..." 
        searchKey="name"
      />
    </div>
  );
}
