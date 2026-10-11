'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Clock,
  User,
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
  Calendar,
  Globe,
  Hash,
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  timestamp: string | Date;
  actorUserId: string | null;
  actorUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  entityType: string;
  entityId: string;
  actionType: string;
  changeReason?: string | null;
  previousState?: any;
  newState?: any;
  ipAddress?: string | null;
  sessionId?: string | null;
}

export interface AuditLogTableProps {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

function getActionBadgeStyle(action: string) {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    case 'DEACTIVATE':
    case 'PURGE':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    case 'LOGIN':
      return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800';
    case 'LOGOUT':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    case 'FAILED_LOGIN':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800';
    case 'ARCHIVE':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
    case 'TRANSFER':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800';
    case 'SIGN':
    case 'POLICY_CHANGE':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
  }
}

function parseJsonState(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  }
  return JSON.stringify(val, null, 2);
}

/**
 * Audit log data table with color-coded badges, row inspector dialog,
 * and responsive pagination controls.
 */
export function AuditLogTable({ logs, pagination }: AuditLogTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { page, pageSize, total, totalPages } = pagination;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const startEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[180px]">Actor</TableHead>
              <TableHead className="w-[130px]">Action</TableHead>
              <TableHead className="w-[140px]">Entity Type</TableHead>
              <TableHead className="w-[160px]">Entity ID</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-[80px] text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Database className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No audit logs found.</p>
                    <p className="text-xs">Try adjusting your filters or search term.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                let formattedTime = 'Invalid Date';
                try {
                  formattedTime = format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss');
                } catch {
                  formattedTime = String(log.timestamp);
                }

                const actorName = log.actorUser?.fullName || 'System';
                const actorEmail = log.actorUser?.email || '';

                return (
                  <TableRow
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer hover:bg-muted/60 transition-colors"
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{formattedTime}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="truncate text-xs">
                          <p className="font-medium text-foreground truncate">{actorName}</p>
                          {actorEmail && (
                            <p className="text-[11px] text-muted-foreground truncate">{actorEmail}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold px-2 py-0.5 border ${getActionBadgeStyle(
                          log.actionType
                        )}`}
                      >
                        {log.actionType}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-medium text-foreground">
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        {log.entityType}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[150px]" title={log.entityId}>
                      {log.entityId}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={log.changeReason || ''}>
                      {log.changeReason || <span className="text-muted-foreground/50 italic">None</span>}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 text-sm text-muted-foreground">
        <div>
          Showing <span className="font-medium text-foreground">{startEntry}</span> to{' '}
          <span className="font-medium text-foreground">{endEntry}</span> of{' '}
          <span className="font-medium text-foreground">{total}</span> entries
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 px-2.5"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-xs font-medium px-2">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 px-2.5"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Audit Log Detail Dialog */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2 mr-6">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Info className="h-5 w-5 text-primary" />
                    Audit Log Entry #{selectedLog.id}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2 py-0.5 border ${getActionBadgeStyle(
                      selectedLog.actionType
                    )}`}
                  >
                    {selectedLog.actionType}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-xs mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Timestamp: </span>
                    <span className="font-mono font-medium">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Actor: </span>
                    <span className="font-medium">
                      {selectedLog.actorUser?.fullName || selectedLog.actorUserId || 'System'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Entity: </span>
                    <span className="font-mono font-medium">
                      {selectedLog.entityType} ({selectedLog.entityId})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">IP Address: </span>
                    <span className="font-mono">{selectedLog.ipAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {selectedLog.changeReason && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reason / Context
                  </h4>
                  <p className="text-sm bg-muted/30 p-2.5 rounded border">
                    {selectedLog.changeReason}
                  </p>
                </div>
              )}

              {/* State Diffs / JSON viewer */}
              <div className="space-y-4">
                {selectedLog.previousState ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Previous State
                    </h4>
                    <pre className="bg-slate-950 text-slate-100 p-3.5 rounded-md text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                      {parseJsonState(selectedLog.previousState)}
                    </pre>
                  </div>
                ) : null}

                {selectedLog.newState ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      New State / Details
                    </h4>
                    <pre className="bg-slate-950 text-slate-100 p-3.5 rounded-md text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                      {parseJsonState(selectedLog.newState)}
                    </pre>
                  </div>
                ) : null}

                {!selectedLog.previousState && !selectedLog.newState && (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    No state payload recorded for this event.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
