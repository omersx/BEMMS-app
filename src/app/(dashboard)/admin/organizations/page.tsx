import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getOrganizations } from "@/lib/actions/organizations";

export default async function OrganizationsPage() {
  const result = await getOrganizations();
  const organizations = result.success && result.data ? result.data : [];

  const columns = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "defaultTimezone", header: "Timezone" },
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
          <Link href={`/admin/organizations/${item.id}`}>View</Link>
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Organizations" description="Manage all organizations in the platform">
        <Button asChild>
          <Link href="/admin/organizations/new">Add Organization</Link>
        </Button>
      </PageHeader>
      
      <DataTable 
        columns={columns} 
        data={organizations} 
        searchable 
        searchPlaceholder="Search organizations..." 
        searchKey="name"
      />
    </div>
  );
}
