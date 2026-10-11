'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { StaffTicketCard, StaffTicketItem } from '@/components/tickets/staff-ticket-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, TicketCheck, MessageCircle, CheckCircle, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffTicketsViewProps {
  tickets: StaffTicketItem[];
}

type TicketFilter = 'all' | 'active' | 'needs_response' | 'resolved';

export function StaffTicketsView({ tickets }: StaffTicketsViewProps) {
  const [filter, setFilter] = useState<TicketFilter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const total = tickets.length;
    const needsResponse = tickets.filter((t) => t.statusCode === 'waiting_requester').length;
    const resolved = tickets.filter((t) => ['resolved', 'closed'].includes(t.statusCode)).length;
    const active = total - resolved;
    return { total, active, needsResponse, resolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Filter by tab
    if (filter === 'active') {
      result = result.filter((t) => !['resolved', 'closed', 'cancelled'].includes(t.statusCode));
    } else if (filter === 'needs_response') {
      result = result.filter((t) => t.statusCode === 'waiting_requester');
    } else if (filter === 'resolved') {
      result = result.filter((t) => ['resolved', 'closed'].includes(t.statusCode));
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          (t.deviceName && t.deviceName.toLowerCase().includes(q)) ||
          (t.assignedEngineerName && t.assignedEngineerName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tickets, filter, search]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <PageHeader
        title="My Tickets"
        description="Monitor biomedical repair progress and communicate with engineers"
      >
        <Link href="/tickets/create">
          <Button size="lg" className="min-h-[44px]">
            <PlusCircle className="mr-2 h-5 w-5" />
            Report Problem
          </Button>
        </Link>
      </PageHeader>

      {/* Action banner if any tickets need response */}
      {counts.needsResponse > 0 && filter !== 'needs_response' && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <MessageCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{counts.needsResponse} ticket(s)</strong> require your response so engineering can proceed.
            </span>
          </div>
          <button
            onClick={() => setFilter('needs_response')}
            className="text-primary font-semibold hover:underline shrink-0"
          >
            Show Tickets →
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search by ticket number, issue, or equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 text-sm bg-card"
        />
      </div>

      {/* Filter Tabs / Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap',
            filter === 'all'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          All ({counts.total})
        </button>

        <button
          onClick={() => setFilter('active')}
          className={cn(
            'text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
            filter === 'active'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          <Wrench className="w-3 h-3" />
          Active Repair ({counts.active})
        </button>

        {counts.needsResponse > 0 && (
          <button
            onClick={() => setFilter('needs_response')}
            className={cn(
              'text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
              filter === 'needs_response'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 hover:bg-amber-100'
            )}
          >
            <MessageCircle className="w-3 h-3" />
            Needs Reply ({counts.needsResponse})
          </button>
        )}

        <button
          onClick={() => setFilter('resolved')}
          className={cn(
            'text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
            filter === 'resolved'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          <CheckCircle className="w-3 h-3" />
          Resolved ({counts.resolved})
        </button>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 border rounded-2xl bg-card shadow-sm space-y-2">
          <TicketCheck className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm font-medium">
            {search
              ? 'No tickets match your search.'
              : filter === 'needs_response'
              ? 'No tickets currently waiting for your response.'
              : filter === 'active'
              ? 'No active tickets in progress.'
              : "You haven't reported any equipment problems yet."}
          </p>
          <p className="text-muted-foreground text-xs">
            Scan a device QR code or click &quot;Report Problem&quot; above to submit an issue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <StaffTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
