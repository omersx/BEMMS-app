import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TicketPriorityBadge } from "@/components/tickets/ticket-badges";
import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  statusCode: string;
  priorityCode: string;
  reportedAt: Date;
  deviceName?: string | null;
}

interface TicketListCompactProps {
  tickets: TicketItem[];
  title: string;
  emptyMessage: string;
}

export function TicketListCompact({ tickets, title, emptyMessage }: TicketListCompactProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Ticket className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center border rounded-md bg-muted/20">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2.5">
            {tickets.map((ticket) => {
              return (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 min-h-[44px]">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-primary font-mono">{ticket.ticketNumber}</span>
                        <TicketPriorityBadge priority={ticket.priorityCode} />
                      </div>
                      <span className="text-sm font-medium line-clamp-1">{ticket.title}</span>
                      {ticket.deviceName && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{ticket.deviceName}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap self-start sm:self-auto shrink-0">
                      {formatDistanceToNow(new Date(ticket.reportedAt), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

