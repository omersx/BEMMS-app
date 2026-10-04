'use client';

import { Card } from '@/components/ui/card';
import { Users, Radio, PhoneCall, Wrench, ShieldCheck, Moon } from 'lucide-react';

interface TeamHeaderStatsProps {
  stats: {
    totalEngineers: number;
    onDutyToday: number;
    onCallToday: number;
    inMaintenanceToday: number;
    offDutyToday: number;
    totalActiveWorkOrders: number;
  };
}

export function TeamHeaderStats({ stats }: TeamHeaderStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Total Engineers */}
      <Card className="p-4 bg-card border-border/70 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Team</p>
          <p className="text-2xl font-bold mt-0.5">{stats.totalEngineers}</p>
          <span className="text-[11px] text-muted-foreground">Biomedical Engineers</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Users className="w-5 h-5" />
        </div>
      </Card>

      {/* On Duty */}
      <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">On Duty Today</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.onDutyToday}</p>
          </div>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">In Hospital / Ready</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Radio className="w-5 h-5" />
        </div>
      </Card>

      {/* On Call */}
      <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">On-Call Shift</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">{stats.onCallToday}</p>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">Emergency Responder</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <PhoneCall className="w-5 h-5" />
        </div>
      </Card>

      {/* Active Work Orders */}
      <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Active Workloads</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">{stats.totalActiveWorkOrders}</p>
          <span className="text-[11px] text-blue-700/80 dark:text-blue-400/80">Open Tasks & Tickets</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Wrench className="w-5 h-5" />
        </div>
      </Card>

      {/* Off Duty */}
      <Card className="p-4 bg-slate-50 dark:bg-slate-900/40 border-border/70 shadow-sm col-span-2 md:col-span-1 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Off Duty</p>
          <p className="text-2xl font-bold text-muted-foreground mt-0.5">{stats.offDutyToday}</p>
          <span className="text-[11px] text-muted-foreground">Rest / Post-Call</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Moon className="w-5 h-5" />
        </div>
      </Card>
    </div>
  );
}
