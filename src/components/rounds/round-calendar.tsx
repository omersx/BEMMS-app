'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

interface CalendarDay {
  date: string;
  day: number;
  dayName: string;
  isWorkingDay: boolean;
  status: 'completed' | 'partial' | 'missed' | 'in_progress' | 'scheduled' | 'off_day';
  round: {
    id: string;
    totalDepartments: number;
    completedDepartments: number;
    totalIssuesReported: number;
    totalNotes: number;
  } | null;
}

interface RoundCalendarProps {
  month: number;
  year: number;
  calendarDays: CalendarDay[];
  summary: {
    totalWorkingDays: number;
    completed: number;
    missed: number;
    complianceRate: number;
  };
  engineerName?: string;
  onMonthChange?: (month: number, year: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500',
  partial: 'bg-yellow-400 dark:bg-yellow-600 hover:bg-yellow-500 dark:hover:bg-yellow-500',
  missed: 'bg-red-400 dark:bg-red-600 hover:bg-red-500 dark:hover:bg-red-500',
  in_progress: 'bg-blue-400 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-500 animate-pulse',
  scheduled: 'bg-muted hover:bg-muted-foreground/20',
  off_day: 'bg-transparent',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  partial: 'Partial',
  missed: 'Missed',
  in_progress: 'In Progress',
  scheduled: 'Scheduled',
  off_day: 'Off Day',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function RoundCalendar({
  month,
  year,
  calendarDays,
  summary,
  engineerName,
  onMonthChange,
}: RoundCalendarProps) {
  const router = useRouter();

  // Build calendar grid (weeks × 7)
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const totalDays = calendarDays.length;
  const weeks: (CalendarDay | null)[][] = [];

  let currentWeek: (CalendarDay | null)[] = [];
  // Pad start
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }
  for (const day of calendarDays) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  // Pad end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const handlePrev = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    onMonthChange?.(newMonth, newYear);
  };

  const handleNext = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    onMonthChange?.(newMonth, newYear);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <h3 className="font-semibold text-lg">
            {MONTH_NAMES[month - 1]} {year}
          </h3>
          {engineerName && (
            <p className="text-sm text-muted-foreground">{engineerName}</p>
          )}
        </div>
        <button
          onClick={handleNext}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border bg-card p-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const isToday = day.date === new Date().toISOString().split('T')[0];

              return (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        'aspect-square rounded-sm transition-all duration-150 relative flex items-center justify-center text-xs font-medium',
                        STATUS_COLORS[day.status],
                        day.status === 'off_day' ? 'text-muted-foreground/40' : 'text-white',
                        day.status === 'scheduled' && 'text-muted-foreground',
                        isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                        day.round ? 'cursor-pointer' : 'cursor-default',
                      )}
                      onClick={() => {
                        if (day.round) {
                          router.push(`/rounds/${day.round.id}`);
                        }
                      }}
                    >
                      {day.day}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-0.5">
                      <p className="font-medium">{day.date} — {STATUS_LABELS[day.status]}</p>
                      {day.round && (
                        <>
                          <p>{day.round.completedDepartments}/{day.round.totalDepartments} departments</p>
                          {day.round.totalIssuesReported > 0 && (
                            <p>{day.round.totalIssuesReported} issues reported</p>
                          )}
                          {day.round.totalNotes > 0 && (
                            <p>{day.round.totalNotes} notes</p>
                          )}
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-yellow-400" /> Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-400" /> Missed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-muted border" /> Off Day
          </span>
        </div>
        <div className="text-sm font-medium">
          <span className={cn(
            summary.complianceRate >= 80 ? 'text-green-600 dark:text-green-400' :
            summary.complianceRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          )}>
            {summary.complianceRate}% compliance
          </span>
          <span className="text-muted-foreground ml-1">
            ({summary.completed}/{summary.totalWorkingDays} working days)
          </span>
        </div>
      </div>
    </div>
  );
}
