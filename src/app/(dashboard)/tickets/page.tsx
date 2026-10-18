import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasRole } from '@/lib/auth/rbac';
import { listTickets } from "@/lib/actions/tickets";
import { getMyTickets } from "@/lib/actions/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { TicketCardsView } from "@/components/tickets/ticket-cards-view";
import { StaffTicketsView } from "@/components/tickets/staff-tickets-view";
import { TicketListAutoRefresh } from "@/components/tickets/ticket-list-auto-refresh";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as { id: string; roles: string[] };
  const roles = user.roles || [];
  const isBiomed = hasRole(roles, 'BIOMED_ENG', 'BIOMED_TECH', 'BIOMED_MGR');
  const isAdmin = hasRole(roles, 'SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN');
  const isStaffOnly = hasRole(roles, 'STAFF', 'DEPT_MGR') && !isBiomed && !isAdmin;

  if (isStaffOnly) {
    // Staff view: show only their own tickets with plain-language status, search, and filters
    const myTickets = await getMyTickets(50);
    return (
      <>
        <TicketListAutoRefresh />
        <StaffTicketsView tickets={myTickets} />
      </>
    );
  }

  // Full view for BME/admin
  const result = await listTickets();
  const tickets = (result?.success && Array.isArray(result.data)) ? result.data : [];

  return (
    <div className="space-y-6">
      <TicketListAutoRefresh />
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
  );
}
