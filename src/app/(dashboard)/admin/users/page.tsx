import { getUsers } from "@/lib/actions/users"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, Edit } from "lucide-react"

export default async function UsersPage() {
  const result = await getUsers()
  const users = (result?.success && result.data) ? result.data : []

  const columns = [
    { 
      key: "user",
      header: "User", 
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
            {item.fullName?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{item.fullName}</span>
            <span className="text-xs text-muted-foreground">{item.email}</span>
          </div>
        </div>
      )
    },
    { key: "employeeIdentifier", header: "Employee ID", render: (item: any) => item.employeeIdentifier || "N/A" },
    { 
      key: "roles",
      header: "Roles", 
      render: (item: any) => (
        <div className="flex gap-1 flex-wrap">
          {item.roles?.map((role: any) => (
            <Badge key={role.id} variant="secondary" className="text-xs">{role.name}</Badge>
          )) || <span className="text-muted-foreground text-sm">No roles</span>}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (item: any) => <StatusBadge status={item.accountStatus || item.status} />,
    },
    { key: "lastLoginAt", header: "Last Login", render: (item: any) => item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : "Never" },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/users/${item.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/users/${item.id}/edit`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage system users and access">
        <Button asChild>
          <Link href="/admin/users/invite">
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Link>
        </Button>
      </PageHeader>
      
      <DataTable
        columns={columns}
        data={users}
        searchable
        searchPlaceholder="Search by name or email..."
        emptyMessage="No users found."
      />
    </div>
  )
}
