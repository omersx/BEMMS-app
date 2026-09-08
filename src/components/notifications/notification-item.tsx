'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  TicketCheck, Wrench, Monitor, AlertTriangle,
  MessageSquare, Clock, ShieldCheck, Bell,
} from 'lucide-react';

interface NotificationItemProps {
  id: string;
  notificationType: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  readAt?: Date | string | null;
  createdAt: Date | string;
  onMarkRead?: (id: string) => void;
}

const iconMap: Record<string, typeof Bell> = {
  ticket_assigned: TicketCheck,
  ticket_updated: TicketCheck,
  ticket_comment: MessageSquare,
  pm_due_soon: Clock,
  pm_overdue: AlertTriangle,
  calibration_due: Clock,
  task_review_required: ShieldCheck,
  task_approved: ShieldCheck,
  task_rejected: AlertTriangle,
  device_status_changed: Monitor,
  sla_warning: AlertTriangle,
  system_alert: Bell,
};

const colorMap: Record<string, string> = {
  ticket_assigned: 'text-blue-500',
  ticket_updated: 'text-blue-500',
  ticket_comment: 'text-purple-500',
  pm_due_soon: 'text-amber-500',
  pm_overdue: 'text-red-500',
  calibration_due: 'text-amber-500',
  task_review_required: 'text-orange-500',
  task_approved: 'text-green-500',
  task_rejected: 'text-red-500',
  device_status_changed: 'text-blue-500',
  sla_warning: 'text-red-500',
  system_alert: 'text-gray-500',
};

export function NotificationItem({
  id, notificationType, title, body,
  actionUrl, readAt, createdAt, onMarkRead,
}: NotificationItemProps) {
  const Icon = iconMap[notificationType] || Bell;
  const color = colorMap[notificationType] || 'text-muted-foreground';
  const isUnread = !readAt;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors min-h-[44px]',
        isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50',
      )}
      onClick={() => isUnread && onMarkRead?.(id)}
    >
      <div className={cn('mt-0.5 shrink-0', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm line-clamp-1', isUnread && 'font-semibold')}>
            {title}
          </p>
          {isUnread && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{body}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </div>
  );

  if (actionUrl) {
    return <Link href={actionUrl} className="block">{content}</Link>;
  }

  return content;
}
