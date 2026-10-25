'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoundCalendar } from './round-calendar';
import { getRoundCalendarData } from '@/lib/actions/engineer-rounds';
import {
  CheckCircle2, XCircle, Clock, UserX, Loader2, AlertTriangle, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RoundHistoryClientProps {
  initialHistory: any[];
  initialCalendar: any;
  initialCompliance: any;
  isManager: boolean;
  currentUserId: string;
  pagination: any;
}

export function RoundHistoryClient({
  initialHistory,
  initialCalendar,
  initialCompliance,
  isManager,
  currentUserId,
  pagination,
}: RoundHistoryClientProps) {
  const [calendarData, setCalendarData] = useState(initialCalendar);
  const [isPending, startTransition] = useTransition();

  const handleMonthChange = (month: number, year: number) => {
    startTransition(async () => {
      const result = await getRoundCalendarData({
        engineerId: currentUserId,
        month,
        year,
      });
      if (result.success) {
        setCalendarData(result.data);
      }
    });
  };

  const statusIcons: Record<string, any> = {
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500 animate-pulse" />,
    missed: <XCircle className="h-4 w-4 text-red-500" />,
    scheduled: <Clock className="h-4 w-4 text-muted-foreground" />,
    cancelled: <XCircle className="h-4 w-4 text-muted-foreground" />,
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      {calendarData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Round Activity</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {isPending && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <RoundCalendar
              month={calendarData.month}
              year={calendarData.year}
              calendarDays={calendarData.calendarDays}
              summary={calendarData.summary}
              onMonthChange={handleMonthChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Manager: Team Compliance */}
      {isManager && initialCompliance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Compliance Today</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {initialCompliance.summary.completed}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {initialCompliance.summary.inProgress}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {initialCompliance.summary.missed}
                </p>
                <p className="text-xs text-muted-foreground">Missed</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">
                  {initialCompliance.summary.complianceRate}%
                </p>
                <p className="text-xs text-muted-foreground">Compliance</p>
              </div>
            </div>

            {/* Engineer list */}
            <div className="space-y-1.5">
              {initialCompliance.team.map((member: any) => (
                <div
                  key={member.engineerId}
                  className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50"
                >
                  {member.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : member.status === 'in_progress' ? (
                    <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                  ) : member.status === 'missed' ? (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : member.status === 'off_duty' ? (
                    <UserX className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.engineerName}</p>
                    <p className="text-xs text-muted-foreground">{member.hospitalName}</p>
                  </div>
                  <span className={cn(
                    'text-xs font-medium capitalize',
                    member.status === 'completed' && 'text-green-600 dark:text-green-400',
                    member.status === 'in_progress' && 'text-blue-600 dark:text-blue-400',
                    member.status === 'missed' && 'text-red-600 dark:text-red-400',
                    member.status === 'off_duty' && 'text-muted-foreground',
                  )}>
                    {member.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {initialHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rounds found
            </p>
          ) : (
            <div className="space-y-2">
              {initialHistory.map((round: any) => (
                <Link
                  key={round.id}
                  href={`/rounds/${round.id}`}
                  className="flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {statusIcons[round.status] || statusIcons.scheduled}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {round.engineer?.fullName || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {round.shiftType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(round.roundDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                      {' · '}
                      {round.hospital?.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{round.completedDepartments}/{round.totalDepartments} depts</span>
                      {round.totalIssuesReported > 0 && (
                        <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <AlertTriangle className="h-3 w-3" />
                          {round.totalIssuesReported} issues
                        </span>
                      )}
                      {round.totalNotes > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {round.totalNotes} notes
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
