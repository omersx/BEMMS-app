import { getDepartments } from "@/lib/actions/departments"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Eye, Edit } from "lucide-react"

export default async function DepartmentsPage() {
  // Use server action to fetch data
  const result = await getDepartments()
  const departments = (result?.success && result.data) ? result.data : []

  const columns = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "hospital", header: "Hospital", render: (item: any) => item.hospital?.name || "N/A" },
    { key: "departmentType", header: "Type", render: (item: any) => item.departmentType || "N/A" },
    { key: "manager", header: "Manager", render: (item: any) => item.manager?.fullName || "None" },
    {
      key: "status",
      header: "Status",
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/departments/${item.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/departments/${item.id}/edit`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Departments" description="Manage hospital departments">
        <Button asChild>
          <Link href="/admin/departments/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Link>
        </Button>
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={departments}
        searchable
        searchPlaceholder="Search departments..."
        emptyMessage="No departments found."
      />
    </div>
  )
}
