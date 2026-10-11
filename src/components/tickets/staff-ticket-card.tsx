'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getStaffStatus, getStaffStatusStyle } from '@/lib/utils/staff-status';
import { Monitor, User, MessageCircle } from 'lucide-react';

export interface StaffTicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  statusCode: string;
  reportedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  deviceName?: string | null;
  deviceAssetNumber?: string | null;
  assignedEngineerName?: string | null;
}

export function StaffTicketCard({ ticket }: { ticket: StaffTicketItem }) {
  const status = getStaffStatus(ticket.statusCode);
  const style = getStaffStatusStyle(ticket.statusCode);
  const needsResponse = ticket.statusCode === 'waiting_requester';
  const isResolved = ['resolved', 'closed'].includes(ticket.statusCode);

  const updatedText = ticket.updatedAt
    ? formatRelativeTime(new Date(ticket.updatedAt))
    : ticket.reportedAt
    ? formatRelativeTime(new Date(ticket.reportedAt))
    : '';

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className={cn(
        'block bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md',
        needsResponse && 'border-amber-300 dark:border-amber-800',
        isResolved && 'opacity-75',
        !needsResponse && !isResolved && 'border-border hover:border-primary/50',
      )}
    >
      {/* Response requested banner */}
      {needsResponse && (
        <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 border-b border-amber-200 dark:border-amber-800">
          <MessageCircle className="w-3.5 h-3.5" />
          Response requested — tap to reply
        </div>
      )}

      <div className="p-4">
        {/* Title and status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm line-clamp-1">{ticket.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ticket.ticketNumber}
              {ticket.deviceName && (
                <> · {ticket.deviceName}</>
              )}
            </p>
          </div>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap border',
              style.bg,
              style.text,
              style.border
            )}
          >
            {status.icon} {status.label}
          </span>
        </div>

        {/* Engineer and time */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          {ticket.assignedEngineerName ? (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {ticket.assignedEngineerName}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground/70">
              <User className="w-3 h-3" />
              Awaiting assignment
            </span>
          )}
          {updatedText && (
            <span>Updated {updatedText}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Simple relative time formatter */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
