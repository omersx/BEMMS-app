import { getTriageQueue } from "@/lib/actions/tickets"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { TicketStatusBadge, TicketPriorityBadge, TicketImpactBadge } from "@/components/tickets/ticket-badges"
import { AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"

export default async function TriageQueuePage() {
  // Pass current hospital ID if applicable, or empty for all scoped hospitals
  const result = await getTriageQueue()
  const tickets = (result?.success && Array.isArray(result.data)) ? result.data : []

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
      <div>
        <Link href={`/tickets/${item.id}`} className="font-medium hover:underline line-clamp-1">
          {item.title}
        </Link>
        <span className="text-xs text-muted-foreground">{item.device?.name || "No device"}</span>
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
        <span className={`text-sm flex items-center gap-1 ${hours > 24 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
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

      {tickets.some((t: any) => t.reportedImpact === 'patient_care_affected' && t.statusCode === 'new') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Critical Tickets Awaiting Triage</h3>
            <p className="text-sm text-red-700">There are new tickets marked as affecting patient care. Please review immediately.</p>
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
