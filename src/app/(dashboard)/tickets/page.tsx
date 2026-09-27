import { listTickets } from "@/lib/actions/tickets"
import { PageHeader } from "@/components/shared/page-header"
import { TicketCardsView } from "@/components/tickets/ticket-cards-view"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"

export default async function TicketsPage() {
  const result = await listTickets()
  const tickets = (result?.success && Array.isArray(result.data)) ? result.data : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helpdesk Tickets"
        description="Track device problems, service requests, and maintenance progress"
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

      <TicketCardsView tickets={tickets as any} />
    </div>
  )
}

