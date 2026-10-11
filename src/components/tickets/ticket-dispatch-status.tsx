'use client';

import { Clock, UserCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitingForEngineerBannerProps {
  /** When the ticket was reported */
  reportedAt: Date | string;
  /** The ticket's reported impact level */
  reportedImpact?: string;
  /** Whether to show in compact mode (for card lists) */
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function getWaitingDuration(reportedAt: Date | string): string {
  const now = Date.now();
  const reported = new Date(reportedAt).getTime();
  const diffMs = now - reported;
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'just now';
}

/**
 * Visual indicator that a ticket is waiting for an engineer to accept it.
 * Used on ticket cards and ticket detail pages.
 */
export function WaitingForEngineerBanner({
  reportedAt,
  reportedImpact,
  compact = false,
  className,
  children,
}: WaitingForEngineerBannerProps) {
  const waitDuration = getWaitingDuration(reportedAt);
  const isCritical = reportedImpact === 'patient_care_affected';
  const isUrgent = reportedImpact === 'device_not_usable' || isCritical;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium',
          isCritical
            ? 'text-red-600 dark:text-red-400'
            : isUrgent
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-blue-600 dark:text-blue-400',
          className,
        )}
      >
        <Clock className="w-3 h-3 animate-pulse" />
        <span>Waiting for engineer · {waitDuration}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isCritical
          ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800'
          : isUrgent
          ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
          : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0 mt-0.5 sm:mt-0',
              isCritical
                ? 'bg-red-100 dark:bg-red-900/50'
                : isUrgent
                ? 'bg-amber-100 dark:bg-amber-900/50'
                : 'bg-blue-100 dark:bg-blue-900/50',
            )}
          >
            {isCritical ? (
              <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                'font-semibold text-sm',
                isCritical
                  ? 'text-red-800 dark:text-red-200'
                  : isUrgent
                  ? 'text-amber-800 dark:text-amber-200'
                  : 'text-blue-800 dark:text-blue-200',
              )}
            >
              {isCritical
                ? '🚨 URGENT — Waiting for engineer to accept'
                : '⏳ Waiting for engineer to accept'}
            </h4>
            <p
              className={cn(
                'text-xs mt-1',
                isCritical
                  ? 'text-red-700 dark:text-red-300'
                  : isUrgent
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-blue-700 dark:text-blue-300',
              )}
            >
              No engineer has accepted this ticket yet. Waiting for {waitDuration}.
              {isCritical && ' This ticket affects patient care and requires immediate attention.'}
            </p>
          </div>
        </div>
        {children && (
          <div className="shrink-0 self-end sm:self-center pl-10 sm:pl-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Accepted by Engineer Banner ──────────────────────────────────────────────────

interface AcceptedByEngineerBannerProps {
  engineerName: string;
  acceptedAt: Date | string;
  compact?: boolean;
  className?: string;
}

/**
 * Shows that a ticket has been accepted by an engineer.
 * Used on the staff ticket view to reassure the reporter.
 */
export function AcceptedByEngineerBanner({
  engineerName,
  acceptedAt,
  compact = false,
  className,
}: AcceptedByEngineerBannerProps) {
  const acceptedDate = new Date(acceptedAt);
  const timeStr = acceptedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = acceptedDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400', className)}>
        <UserCheck className="w-3 h-3" />
        <span>Accepted by {engineerName}</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800 p-4', className)}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 shrink-0">
          <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-green-800 dark:text-green-200">
            ✅ Engineer {engineerName} accepted this ticket
          </h4>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Accepted on {dateStr} at {timeStr}. Your reported issue is being investigated.
          </p>
        </div>
      </div>
    </div>
  );
}
