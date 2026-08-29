import { listTickets } from "@/lib/actions/tickets"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TicketStatusBadge, TicketPriorityBadge, TicketImpactBadge } from "@/components/tickets/ticket-badges"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"

export default async function TicketsPage() {
  const result = await listTickets()
  const tickets = (result?.success && Array.isArray(result.data)) ? result.data : []

  const columns = [
    { key: "ticketNumber", header: "Ticket #", render: (item: any) => (
      <Link href={`/tickets/${item.id}`} className="text-primary hover:underline font-mono text-sm">
        {item.ticketNumber}
      </Link>
    )},
    { key: "title", header: "Title", render: (item: any) => (
      <Link href={`/tickets/${item.id}`} className="font-medium hover:underline line-clamp-1">
        {item.title}
      </Link>
    )},
    { key: "device", header: "Device", render: (item: any) => (
      <span className="text-sm">{item.device?.name || "No device"}</span>
    )},
    { key: "department", header: "Department", render: (item: any) => (
      <span className="text-sm">{item.hospital?.name} / {item.department?.name}</span>
    )},
    { key: "priority", header: "Priority", render: (item: any) => (
      <TicketPriorityBadge priority={item.priorityCode} />
    )},
    { key: "status", header: "Status", render: (item: any) => (
      <TicketStatusBadge status={item.statusCode} />
    )},
    { key: "reporter", header: "Reported By", render: (item: any) => (
      <span className="text-sm">{item.reportedByUser?.fullName || "—"}</span>
    )},
    { key: "assignee", header: "Assigned To", render: (item: any) => (
      <span className="text-sm">{item.assignedEngineer?.fullName || "Unassigned"}</span>
    )},
    { key: "date", header: "Date", render: (item: any) => (
      <span className="text-xs text-muted-foreground">
        {new Date(item.reportedAt).toLocaleDateString()}
      </span>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helpdesk Tickets"
        description="Track device problems and service requests"
      >
        <div className="flex gap-2">
          <Link href="/tickets/triage">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Triage Queue
            </Button>
          </Link>
          <Link href="/tickets/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Report Problem
            </Button>
          </Link>
        </div>
      </PageHeader>

      <DataTable
        data={tickets}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Search tickets by title, number..."
      />
    </div>
  )
}
