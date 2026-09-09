import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <div className="space-y-3">
            {tickets.map((ticket) => {
              // Determine priority badge color
              let priorityColor = "bg-gray-100 text-gray-800";
              let priorityLabel = ticket.priorityCode;
              if (ticket.priorityCode === 'p1_critical') {
                priorityColor = "bg-red-100 text-red-800 border-red-200";
                priorityLabel = "Critical";
              } else if (ticket.priorityCode === 'p2_high') {
                priorityColor = "bg-orange-100 text-orange-800 border-orange-200";
                priorityLabel = "High";
              } else if (ticket.priorityCode === 'p3_normal') {
                priorityColor = "bg-blue-100 text-blue-800 border-blue-200";
                priorityLabel = "Normal";
              } else if (ticket.priorityCode === 'p4_low') {
                priorityColor = "bg-gray-100 text-gray-800 border-gray-200";
                priorityLabel = "Low";
              }

              return (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 min-h-[44px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">{ticket.ticketNumber}</span>
                        <Badge variant="outline" className={cn("text-xs font-normal", priorityColor)}>
                          {priorityLabel}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium line-clamp-1">{ticket.title}</span>
                      {ticket.deviceName && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{ticket.deviceName}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap self-start sm:self-auto">
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
