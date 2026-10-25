'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DepartmentVisitSheet } from './department-visit-sheet';
import { completeRound } from '@/lib/actions/engineer-rounds';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, PartyPopper,
  FileText, Loader2, SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Visit {
  id: string;
  departmentId: string;
  departmentName: string;
  sequence: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  ticketCount: number;
  notes: {
    id: string;
    noteText: string;
    deviceMentions: any[];
    author?: { id: string; fullName: string };
  }[];
  department: { id: string; name: string; code: string };
}

interface RoundData {
  id: string;
  roundDate: string;
  shiftType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  totalDepartments: number;
  completedDepartments: number;
  totalIssuesReported: number;
  totalNotes: number;
  hospitalId: string;
  hospital: { id: string; name: string };
  engineer: { id: string; fullName: string };
  departmentVisits: Visit[];
}

interface RoundDepartmentListProps {
  round: RoundData;
}

export function RoundDepartmentList({ round: initialRound }: RoundDepartmentListProps) {
  const router = useRouter();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const round = initialRound;
  const visits = round.departmentVisits;
  const completedCount = visits.filter(v => v.status === 'completed').length;
  const progress = visits.length > 0 ? (completedCount / visits.length) * 100 : 0;
  const allCompleted = completedCount === visits.length;
  const isCompleted = round.status === 'completed';

  const handleVisitClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setSheetOpen(true);
  };

  const handleCompleteRound = () => {
    startTransition(async () => {
      const result = await completeRound({ roundId: round.id });
      if (result.success) {
        toast.success('Round completed successfully!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to complete round');
      }
    });
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {completedCount} / {visits.length} Departments
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {round.startedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Started {formatTime(round.startedAt)} · {round.shiftType} shift
            </p>
          )}
        </CardContent>
      </Card>

      {/* Department List (To-Do Style) */}
      <div className="space-y-2">
        {visits.map((visit) => {
          const isVisitCompleted = visit.status === 'completed';
          const isSkipped = visit.status === 'skipped';

          return (
            <button
              key={visit.id}
              onClick={() => handleVisitClick(visit)}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-lg border transition-all text-left',
                isVisitCompleted
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/40'
                  : isSkipped
                  ? 'bg-muted/30 border-muted opacity-60'
                  : 'bg-card border-border hover:border-primary/40 hover:shadow-sm active:scale-[0.99]',
              )}
              disabled={isCompleted}
            >
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                {isVisitCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isSkipped ? (
                  <SkipForward className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'font-medium',
                    isVisitCompleted && 'text-green-700 dark:text-green-400',
                    isSkipped && 'line-through text-muted-foreground',
                  )}>
                    {visit.departmentName}
                  </span>
                  {isVisitCompleted && visit.completedAt && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTime(visit.completedAt)}
                    </span>
                  )}
                </div>

                {/* Visit details */}
                {isVisitCompleted && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {visit.notes.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {visit.notes.length} note{visit.notes.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {visit.ticketCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle className="h-3 w-3" />
                        {visit.ticketCount} issue{visit.ticketCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {visit.notes.length === 0 && visit.ticketCount === 0 && (
                      <span className="text-xs text-green-600/70 dark:text-green-500/70">
                        No issues
                      </span>
                    )}
                  </div>
                )}

                {/* First note preview */}
                {visit.notes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    &quot;{visit.notes[0].noteText}&quot;
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Complete Round Button */}
      {!isCompleted && (
        <div className="pt-2">
          {allCompleted ? (
            <Card className="border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20">
              <CardContent className="pt-6 text-center space-y-3">
                <PartyPopper className="h-8 w-8 mx-auto text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    All departments visited!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {round.totalIssuesReported} issue{round.totalIssuesReported !== 1 ? 's' : ''} reported · {round.totalNotes} note{round.totalNotes !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleCompleteRound}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  Complete Round
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={handleCompleteRound}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              Complete Round ({completedCount}/{visits.length} done)
            </Button>
          )}
        </div>
      )}

      {/* Completed Summary */}
      {isCompleted && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <h3 className="font-semibold text-green-700 dark:text-green-400">
              Round Completed
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount}/{visits.length} departments · {round.totalIssuesReported} issues · {round.totalNotes} notes
            </p>
            {round.startedAt && round.completedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatTime(round.startedAt)} — {formatTime(round.completedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Department Visit Sheet */}
      <DepartmentVisitSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        visit={selectedVisit}
        roundId={round.id}
        hospitalId={round.hospitalId}
        onCompleted={() => router.refresh()}
      />
    </div>
  );
}
