import { getTriageQueue } from "@/lib/actions/tickets"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TicketStatusBadge, TicketPriorityBadge, TicketImpactBadge } from "@/components/tickets/ticket-badges"
import { WaitingForEngineerBanner } from "@/components/tickets/ticket-dispatch-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, Inbox, CheckCircle2, Timer } from "lucide-react"
import Link from "next/link"

export default async function TriageQueuePage() {
  const result = await getTriageQueue()
  const tickets = (result?.success && Array.isArray(result.data)) ? result.data : []

  // Queue metrics
  const newCount = tickets.filter((t: any) => t.statusCode === 'new').length
  const criticalCount = tickets.filter((t: any) =>
    t.reportedImpact === 'patient_care_affected' && t.statusCode === 'new'
  ).length
  const unacceptedCount = tickets.filter((t: any) =>
    !t.assignedEngineerUserId && t.statusCode === 'new'
  ).length

  // Calculate average wait time for new tickets
  const newTickets = tickets.filter((t: any) => t.statusCode === 'new')
  const avgWaitHours = newTickets.length > 0
    ? Math.round(newTickets.reduce((sum: number, t: any) => {
        return sum + (Date.now() - new Date(t.reportedAt).getTime()) / (1000 * 60 * 60)
      }, 0) / newTickets.length)
    : 0

  const columns = [
    { key: "priority", header: "Priority", render: (item: any) => (
      <TicketPriorityBadge priority={item.priorityCode} />
    )},
    { key: "ticketNumber", header: "Ticket #", render: (item: any) => (
      <Link href={`/tickets/${item.id}`} className="text-primary hover:underline font-mono text-sm">
        {item.ticketNumber}
      </Link>
    )},
    { key: "title", header: "Issue", render: (item: any) => (
      <div className="space-y-1">
        <Link href={`/tickets/${item.id}`} className="font-medium hover:underline line-clamp-1">
          {item.title}
        </Link>
        <span className="text-xs text-muted-foreground">{item.device?.name || "No device"}</span>
        {/* Show waiting status for unaccepted tickets */}
        {item.statusCode === 'new' && !item.assignedEngineerUserId && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Waiting for engineer</span>
          </div>
        )}
      </div>
    )},
    { key: "impact", header: "Reported Impact", render: (item: any) => (
      <TicketImpactBadge impact={item.reportedImpact} />
    )},
    { key: "location", header: "Location", render: (item: any) => (
      <span className="text-sm">{item.hospital?.name} / {item.department?.name}</span>
    )},
    { key: "status", header: "Status", render: (item: any) => (
      <TicketStatusBadge status={item.statusCode} />
    )},
    { key: "age", header: "Age", render: (item: any) => {
      const hours = Math.floor((Date.now() - new Date(item.reportedAt).getTime()) / (1000 * 60 * 60))
      return (
        <span className={`text-sm flex items-center gap-1 ${hours > 24 ? 'text-red-600 font-medium' : hours > 4 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
          <Clock className="w-3 h-3" />
          {hours < 1 ? '< 1h' : `${hours}h`}
        </span>
      )
    }},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Triage Queue"
        description="Review, classify, and assign incoming service requests"
      />

      {/* Queue Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Triage</CardTitle>
            <Inbox className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCount}</div>
            <p className="text-xs text-muted-foreground mt-1">New tickets to review</p>
          </CardContent>
        </Card>

        <Card className={criticalCount > 0 ? 'border-red-300 dark:border-red-800' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-600 animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-600' : ''}`}>
              {criticalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Patient care affected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unaccepted</CardTitle>
            <Timer className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unacceptedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">No engineer assigned yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgWaitHours > 24 ? 'text-red-600' : avgWaitHours > 4 ? 'text-amber-600' : ''}`}>
              {avgWaitHours}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average queue time</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alert */}
      {criticalCount > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0 animate-pulse" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              {criticalCount} Critical Ticket{criticalCount > 1 ? 's' : ''} Awaiting Triage
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              Tickets marked as affecting patient care require immediate attention. Please review and accept now.
            </p>
          </div>
        </div>
      )}

      <DataTable
        data={tickets}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Filter queue..."
      />
    </div>
  )
}
