import { listMaintenanceTasks } from "@/lib/actions/maintenance-tasks"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import {
  MaintenanceStatusBadge,
  MaintenanceTypeBadge,
} from "@/components/maintenance/maintenance-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

export default async function MaintenanceDashboardPage() {
  const result = await listMaintenanceTasks({ page: 1, pageSize: 50 })
  const tasks = result?.success && Array.isArray(result.data) ? result.data : []

  // Calculate KPI metrics from maintenance tasks
  const inProgressCount = tasks.filter(
    (t: any) => t.statusCode === "in_progress"
  ).length

  const awaitingReviewCount = tasks.filter(
    (t: any) =>
      t.statusCode === "awaiting_review" ||
      t.statusCode === "work_complete" ||
      t.statusCode === "awaiting_release"
  ).length

  const now = new Date()
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const dueSoonOrOverdueCount = tasks.filter((t: any) => {
    if (t.statusCode === "closed" || t.statusCode === "cancelled") return false
    if (!t.dueDate) return false
    const due = new Date(t.dueDate)
    return due <= sevenDaysFromNow
  }).length

  const closedThisMonthCount = tasks.filter((t: any) => {
    if (t.statusCode !== "closed") return false
    const taskDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt)
    return (
      taskDate.getMonth() === now.getMonth() &&
      taskDate.getFullYear() === now.getFullYear()
    )
  }).length

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
      header: "Type",
      render: (item: any) => (
        <MaintenanceTypeBadge type={item.maintenanceType} />
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
        title="Maintenance"
        description="Manage maintenance tasks, PM schedules, and work orders"
      >
        <div className="flex flex-wrap gap-2">
          <Link href="/maintenance/plans">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              PM Plans
            </Button>
          </Link>
          <Link href="/maintenance/checklists">
            <Button variant="outline">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Checklists
            </Button>
          </Link>
          <Link href="/maintenance/tasks/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks In Progress
            </CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active maintenance work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Awaiting Review
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awaitingReviewCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending review / sign-off
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Due Soon / Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonOrOverdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Due within 7 days or past due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Closed This Month
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedThisMonthCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed work orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recent Tasks</h2>
            <p className="text-sm text-muted-foreground">
              Latest maintenance requests and scheduled work
            </p>
          </div>
          <Link href="/maintenance/tasks">
            <Button variant="ghost" size="sm">
              View All Tasks
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <DataTable
          data={tasks.slice(0, 10)}
          columns={columns}
          searchable={true}
          searchKey="title"
          searchPlaceholder="Search maintenance tasks..."
        />
      </div>
    </div>
  )
}
