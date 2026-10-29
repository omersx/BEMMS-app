'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, CheckCircle2, Clock, AlertTriangle, XCircle,
  ArrowRight, ShieldCheck, Building2, Calendar, Coffee, History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ComplianceSummary {
  totalEngineers: number;
  scheduledToday: number;
  completed: number;
  inProgress: number;
  missed: number;
  offDuty: number;
  complianceRate: number;
}

interface TeamMemberRound {
  engineerId: string;
  engineerName: string;
  hospitalName: string;
  jobTitle?: string;
  isWorkingDay: boolean;
  status: string; // 'completed' | 'in_progress' | 'pending' | 'off_duty' | 'missed'
  round: {
    id: string;
    status: string;
    startedAt: string | Date | null;
    completedAt: string | Date | null;
    completedDepartments: number;
    totalDepartments: number;
    totalIssuesReported: number;
    totalNotes: number;
  } | null;
}

interface ManagerRoundsDashboardProps {
  compliance: {
    date: string;
    summary: ComplianceSummary;
    team: TeamMemberRound[];
  };
  hasOwnProfile?: boolean;
}

export function ManagerRoundsDashboard({
  compliance,
  hasOwnProfile = false,
}: ManagerRoundsDashboardProps) {
  const { summary, team } = compliance;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatTime = (ts: string | Date | null | undefined) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Supervisor banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary text-xs uppercase font-semibold">
                  Supervisor Dashboard
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {todayStr}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">Today&apos;s Engineering Rounds</h2>
              <p className="text-xs text-muted-foreground">
                Real-time oversight of biomedical daily department rounds and facility safety inspections.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/rounds/history">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <History className="h-3.5 w-3.5" />
                  Full History
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">On Duty Today</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.scheduledToday}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              of {summary.totalEngineers} total engineers
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">In Progress</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {summary.inProgress}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Actively inspecting</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Completed</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {summary.completed}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Rounds signed off</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Compliance</span>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className={cn(
              "text-2xl font-bold mt-1",
              summary.complianceRate >= 80 ? "text-green-600 dark:text-green-400" :
              summary.complianceRate >= 50 ? "text-amber-600 dark:text-amber-400" :
              "text-red-600 dark:text-red-400"
            )}>
              {summary.complianceRate}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Round adherence</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Roster Today */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Biomedical Engineering Team</CardTitle>
              <CardDescription className="text-xs">
                Duty roster and department inspection status for today
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {team.length} Member{team.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/50">
          {team.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No biomedical engineers configured yet. Add engineers in User Management.
            </div>
          ) : (
            team.map((member) => {
              const isCompleted = member.status === 'completed';
              const isInProgress = member.status === 'in_progress';
              const isOffDuty = member.status === 'off_duty';
              const isMissed = member.status === 'missed';

              return (
                <div
                  key={member.engineerId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : isInProgress ? (
                        <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                      ) : isMissed ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : isOffDuty ? (
                        <Coffee className="h-5 w-5 text-muted-foreground/60" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">
                          {member.engineerName}
                        </span>
                        {member.jobTitle && (
                          <span className="text-[11px] text-muted-foreground">
                            · {member.jobTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" />
                          {member.hospitalName}
                        </span>

                        {member.round?.startedAt && (
                          <span>
                            · Started {formatTime(member.round.startedAt)}
                          </span>
                        )}

                        {member.round?.completedAt && (
                          <span>
                            · Finished {formatTime(member.round.completedAt)}
                          </span>
                        )}

                        {member.round && member.round.totalIssuesReported > 0 && (
                          <span className="text-amber-500 flex items-center gap-0.5 font-medium">
                            · <AlertTriangle className="h-3 w-3" /> {member.round.totalIssuesReported} issue{member.round.totalIssuesReported !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                    <div className="text-right">
                      {isCompleted ? (
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs">
                          Completed ({member.round?.completedDepartments}/{member.round?.totalDepartments})
                        </Badge>
                      ) : isInProgress ? (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs animate-pulse">
                          In Progress ({member.round?.completedDepartments || 0}/{member.round?.totalDepartments || 0})
                        </Badge>
                      ) : isOffDuty ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Scheduled Off
                        </Badge>
                      ) : isMissed ? (
                        <Badge variant="destructive" className="text-xs">
                          Missed Round
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Pending Start
                        </Badge>
                      )}
                    </div>

                    {member.round?.id ? (
                      <Link href={`/rounds/${member.round.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs px-2.5">
                          View Round
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Admin notice */}
      {!hasOwnProfile && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          Administrator note: You are logged in with administrative oversight. If you also need to conduct daily inspections yourself, assign an engineer profile to your account in Settings → Users.
        </p>
      )}
    </div>
  );
}
