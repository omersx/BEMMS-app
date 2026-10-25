import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getRoundDetail } from '@/lib/actions/engineer-rounds';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, Circle, SkipForward, AlertTriangle, FileText,
  Clock, Building2, ShieldCheck, ArrowLeft, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const result = await getRoundDetail(id);

  if (!result.success || !result.data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Round Detail" />
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{result.error || 'Round not found'}</p>
            <Link href="/rounds/history">
              <Button variant="outline" className="mt-4">Back to History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const round = result.data;
  const formatTime = (ts: Date | string | null | undefined) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const formatDate = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const completedVisits = round.departmentVisits.filter((v: any) => v.status === 'completed');
  const skippedVisits = round.departmentVisits.filter((v: any) => v.status === 'skipped');

  const statusColor = {
    completed: 'text-green-600 dark:text-green-400',
    in_progress: 'text-blue-600 dark:text-blue-400',
    missed: 'text-red-600 dark:text-red-400',
    scheduled: 'text-muted-foreground',
    cancelled: 'text-muted-foreground',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Round Detail">
        <Link href="/rounds/history">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* Round Info Card */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{round.engineer?.fullName}</h2>
            <span className={cn(
              'text-sm font-medium capitalize',
              statusColor[round.status as keyof typeof statusColor] || 'text-muted-foreground',
            )}>
              {round.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(round.roundDate)} · <span className="capitalize">{round.shiftType}</span> shift
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {round.hospital?.name}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(round.startedAt)} — {formatTime(round.completedAt)}
            </div>
            {round.startSignature && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <ShieldCheck className="h-4 w-4" />
                Signed at {formatTime(round.startSignature.signedAt as any)}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 pt-2 border-t text-sm">
            <div>
              <span className="text-muted-foreground">Departments: </span>
              <span className="font-medium">{completedVisits.length}/{round.departmentVisits.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Issues: </span>
              <span className="font-medium">{round.totalIssuesReported}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Notes: </span>
              <span className="font-medium">{round.totalNotes}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Visits */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Department Visits
        </h3>
        {round.departmentVisits.map((visit: any) => (
          <Card key={visit.id} className={cn(
            visit.status === 'completed' && 'border-green-200 dark:border-green-900/40',
            visit.status === 'skipped' && 'opacity-60',
          )}>
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                {visit.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : visit.status === 'skipped' ? (
                  <SkipForward className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                <span className="font-medium">{visit.departmentName}</span>
                {visit.completedAt && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatTime(visit.startedAt)} — {formatTime(visit.completedAt)}
                  </span>
                )}
              </div>

              {/* Notes */}
              {visit.notes?.length > 0 && (
                <div className="ml-7 space-y-1.5">
                  {visit.notes.map((note: any) => (
                    <div key={note.id} className="text-sm bg-muted/50 rounded-md p-2.5">
                      <p className="text-foreground">{note.noteText}</p>
                      {note.deviceMentions?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {note.deviceMentions.map((m: any, i: number) => (
                            <span
                              key={`${m.deviceId}-${i}`}
                              className="inline-flex items-center text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded"
                            >
                              @{m.deviceName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tickets */}
              {visit.tickets?.length > 0 && (
                <div className="ml-7 space-y-1">
                  {visit.tickets.map((ticket: any) => (
                    <Link
                      key={ticket.ticketNumber}
                      href={`/tickets/${ticket.ticketNumber}`}
                      className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {ticket.ticketNumber} — {ticket.title}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
