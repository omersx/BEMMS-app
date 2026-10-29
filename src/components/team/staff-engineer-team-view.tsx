'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Wrench,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EngineerInfo {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string;
  specialization: string | null;
  extension: string | null;
  mobileNumber: string | null;
  dutyStatus: string;
  shiftHours: string | null;
  workingDays: string[];
  onCallDays: string[];
  coveredDepartments: { id: string; name: string; code: string }[];
  hospitalName: string | null;
  activeTicketsCount: number;
  activeMaintenanceCount: number;
  assignedDevicesCount: number;
}

interface StaffEngineerTeamViewProps {
  engineers: EngineerInfo[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DUTY_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof CheckCircle;
  }
> = {
  on_duty: {
    label: 'On Duty',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle,
  },
  on_call: {
    label: 'On Call',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Phone,
  },
  in_maintenance: {
    label: 'In Maintenance',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: Wrench,
  },
  off_duty: {
    label: 'Off Duty',
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/30',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: Moon,
  },
};

export function StaffEngineerTeamView({ engineers }: StaffEngineerTeamViewProps) {
  const [filter, setFilter] = useState<'all' | 'available'>('all');

  const availableEngineers = engineers.filter(
    (e) => e.dutyStatus === 'on_duty' || e.dutyStatus === 'on_call'
  );
  const filteredEngineers =
    filter === 'available' ? availableEngineers : engineers;

  const todayIndex = new Date().getDay();
  const todayName = DAYS_OF_WEEK[todayIndex];

  return (
    <div className="space-y-5">
      {/* Summary Strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-green-700 dark:text-green-300">
            {availableEngineers.length} available today
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {engineers.length} total engineers
        </span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
            filter === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          All ({engineers.length})
        </button>
        <button
          onClick={() => setFilter('available')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
            filter === 'available'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          Available Now ({availableEngineers.length})
        </button>
      </div>

      {/* Engineer Cards */}
      {filteredEngineers.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground text-sm">
            No engineers are currently available.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEngineers.map((eng) => (
            <EngineerCard
              key={eng.id}
              engineer={eng}
              todayName={todayName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EngineerCard({
  engineer,
  todayName,
}: {
  engineer: EngineerInfo;
  todayName: string;
}) {
  const statusConfig = DUTY_STATUS_CONFIG[engineer.dutyStatus] || DUTY_STATUS_CONFIG.off_duty;
  const StatusIcon = statusConfig.icon;
  const initials = engineer.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isAvailable =
    engineer.dutyStatus === 'on_duty' || engineer.dutyStatus === 'on_call';

  return (
    <Card
      className={cn(
        'shadow-sm overflow-hidden',
        isAvailable
          ? 'border-green-200 dark:border-green-900'
          : 'opacity-75'
      )}
    >
      {/* Status Banner */}
      <div
        className={cn(
          'px-4 py-2 flex items-center gap-2 text-xs font-semibold border-b',
          statusConfig.bgColor,
          statusConfig.borderColor,
          statusConfig.color
        )}
      >
        <StatusIcon className="w-3.5 h-3.5" />
        {statusConfig.label}
        {engineer.shiftHours && (
          <span className="text-muted-foreground font-normal ml-auto">
            {engineer.shiftHours}
          </span>
        )}
      </div>

      <CardContent className="p-4">
        {/* Name and Role */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback
              className={cn(
                'text-sm font-bold',
                isAvailable
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base">{engineer.fullName}</h3>
            <p className="text-sm text-muted-foreground">{engineer.jobTitle}</p>
            {engineer.specialization && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {engineer.specialization}
              </p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-2">
          {engineer.mobileNumber && (
            <a
              href={`tel:${engineer.mobileNumber}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline min-h-[36px]"
            >
              <Phone className="w-4 h-4 shrink-0" />
              {engineer.mobileNumber}
            </a>
          )}
          {engineer.extension && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              Ext. {engineer.extension}
            </div>
          )}
          <a
            href={`mailto:${engineer.email}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline min-h-[36px]"
          >
            <Mail className="w-4 h-4 shrink-0" />
            {engineer.email}
          </a>
        </div>

        {/* Weekly Schedule Calendar */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />
            Weekly Schedule
          </p>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => {
              const isWorkDay = engineer.workingDays.includes(day);
              const isOnCallDay = engineer.onCallDays.includes(day);
              const isToday = day === todayName;

              return (
                <div
                  key={day}
                  className={cn(
                    'flex flex-col items-center py-1.5 rounded-lg text-center border',
                    isToday && 'ring-2 ring-primary ring-offset-1',
                    isWorkDay
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                      : isOnCallDay
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                      : 'bg-muted/30 border-border'
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-bold leading-none',
                      isToday
                        ? 'text-primary'
                        : isWorkDay
                        ? 'text-green-700 dark:text-green-300'
                        : isOnCallDay
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-muted-foreground'
                    )}
                  >
                    {day}
                  </span>
                  <span className="text-[10px] mt-0.5 leading-none">
                    {isWorkDay ? '✓' : isOnCallDay ? '📞' : '—'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Working
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              On Call
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted inline-block border" />
              Off
            </span>
          </div>
        </div>

        {/* Covered Departments */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Covers Departments
          </p>
          <div className="flex flex-wrap gap-1">
            {engineer.coveredDepartments.length > 0 ? (
              engineer.coveredDepartments.map((dept) => (
                <Badge
                  key={dept.id}
                  variant="secondary"
                  className="text-xs"
                >
                  {dept.name}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                All Departments (Facility-wide)
              </Badge>
            )}
          </div>
        </div>

        {/* Current Workload */}
        {(engineer.activeTicketsCount > 0 ||
          engineer.activeMaintenanceCount > 0) && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Currently handling:{' '}
              {engineer.activeTicketsCount > 0 && (
                <span className="font-medium text-foreground">
                  {engineer.activeTicketsCount} ticket
                  {engineer.activeTicketsCount !== 1 ? 's' : ''}
                </span>
              )}
              {engineer.activeTicketsCount > 0 &&
                engineer.activeMaintenanceCount > 0 &&
                ' and '}
              {engineer.activeMaintenanceCount > 0 && (
                <span className="font-medium text-foreground">
                  {engineer.activeMaintenanceCount} maintenance task
                  {engineer.activeMaintenanceCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
