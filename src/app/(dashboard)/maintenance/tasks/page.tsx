import { listMaintenanceTasks } from "@/lib/actions/maintenance-tasks"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import {
  MaintenanceStatusBadge,
  MaintenanceTypeBadge,
  PriorityBadge,
} from "@/components/maintenance/maintenance-badges"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function MaintenanceTasksPage() {
  const result = await listMaintenanceTasks({ page: 1, pageSize: 100 })
  const tasks = result?.success && Array.isArray(result.data) ? result.data : []

  const columns = [
    {
      key: "taskNumber",
      header: "Task #",
      render: (item: any) => (
        <Link
          href={`/maintenance/tasks/${item.id}`}
          className="text-primary hover:underline font-mono text-sm font-medium"
        >
          {item.taskNumber}
        </Link>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (item: any) => (
        <Link
          href={`/maintenance/tasks/${item.id}`}
          className="font-medium hover:underline line-clamp-1"
        >
          {item.title}
        </Link>
      ),
    },
    {
      key: "device",
      header: "Device",
      render: (item: any) => (
        <div>
          <span className="text-sm font-medium">
            {item.device?.name || "No device"}
          </span>
          {item.device?.assetNumber && (
            <span className="text-xs text-muted-foreground block">
              Asset: {item.device.assetNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "maintenanceType",
      header: "Maintenance Type",
      render: (item: any) => (
        <MaintenanceTypeBadge type={item.maintenanceType} />
      ),
    },
    {
      key: "priorityCode",
      header: "Priority",
      render: (item: any) => (
        <PriorityBadge priority={item.priorityCode} showIcon />
      ),
    },
    {
      key: "statusCode",
      header: "Status",
      render: (item: any) => (
        <MaintenanceStatusBadge status={item.statusCode} showIcon />
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (item: any) => (
        <span className="text-sm">
          {item.assignedEngineer?.fullName || "Unassigned"}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (item: any) => (
        <span className="text-xs text-muted-foreground">
          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Tasks"
        description="View, filter, and manage maintenance work orders and execution stages"
      >
        <Link href="/maintenance/tasks/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </Link>
      </PageHeader>

      <DataTable
        data={tasks}
        columns={columns}
        searchable={true}
        searchKey="title"
        searchPlaceholder="Search tasks by title, number..."
      />
    </div>
  )
}
