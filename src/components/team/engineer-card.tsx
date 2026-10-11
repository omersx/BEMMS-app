'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Phone,
  Mail,
  PhoneCall,
  Clock,
  Calendar,
  Building2,
  Wrench,
  CheckCircle2,
  Moon,
  ChevronDown,
  Edit,
} from 'lucide-react';
import { EngineerTeamMember, updateEngineerDutyStatus } from '@/lib/actions/engineers';
import { EngineerDutyStatus } from '@/lib/db/schema/engineer-profiles';
import { toast } from 'sonner';

interface EngineerCardProps {
  engineer: EngineerTeamMember;
  onEdit?: (engineer: EngineerTeamMember) => void;
}

export function EngineerCard({ engineer, onEdit }: EngineerCardProps) {
  const [currentStatus, setCurrentStatus] = useState<EngineerDutyStatus>(engineer.dutyStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: EngineerDutyStatus) => {
    setIsUpdating(true);
    try {
      const res = await updateEngineerDutyStatus(engineer.id, newStatus);
      if (res.success) {
        setCurrentStatus(newStatus);
        toast.success(`Updated status for ${engineer.fullName} to ${formatStatus(newStatus)}`);
      } else {
        toast.error(res.error || 'Failed to update duty status');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatStatus = (status: EngineerDutyStatus) => {
    switch (status) {
      case 'on_duty':
        return 'On Duty';
      case 'on_call':
        return 'On Call';
      case 'in_maintenance':
        return 'In Maintenance';
      case 'off_duty':
        return 'Off Duty';
    }
  };

  const getStatusBadge = (status: EngineerDutyStatus) => {
    switch (status) {
      case 'on_duty':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium hover:bg-emerald-500/20 whitespace-nowrap text-xs h-6 px-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            On Duty
          </Badge>
        );
      case 'on_call':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 font-medium hover:bg-amber-500/20 whitespace-nowrap text-xs h-6 px-2">
            <PhoneCall className="w-3 h-3 text-amber-500 animate-pulse" />
            On Call
          </Badge>
        );
      case 'in_maintenance':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1.5 font-medium hover:bg-blue-500/20 whitespace-nowrap text-xs h-6 px-2">
            <Wrench className="w-3 h-3 text-blue-500" />
            In Maintenance
          </Badge>
        );
      case 'off_duty':
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1.5 font-medium whitespace-nowrap text-xs h-6 px-2">
            <Moon className="w-3 h-3" />
            Off Duty
          </Badge>
        );
    }
  };

  const cleanName = (engineer.fullName || '').replace(/^Eng\.\s*/i, '');
  const initials =
    cleanName
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'BE';

  return (
    <Card className="flex flex-col border-border/70 hover:shadow-md transition-shadow relative overflow-hidden bg-card">
      {/* Top status accent border */}
      <div
        className={`h-1.5 w-full ${
          currentStatus === 'on_duty'
            ? 'bg-emerald-500'
            : currentStatus === 'on_call'
            ? 'bg-amber-500'
            : currentStatus === 'in_maintenance'
            ? 'bg-blue-500'
            : 'bg-muted-foreground/30'
        }`}
      />

      <CardHeader className="pb-3 pt-3.5 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar Initials */}
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20 shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-semibold text-base leading-snug truncate text-foreground" title={engineer.fullName}>
                  {engineer.fullName}
                </h3>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                    onClick={() => onEdit(engineer)}
                    title="Edit Schedule & Specialization"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-xs font-medium text-primary truncate mt-0.5">{engineer.jobTitle}</p>
            </div>
          </div>

          {/* Quick status dropdown */}
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-1.5 text-xs gap-1 hover:bg-muted/60 cursor-pointer" disabled={isUpdating}>
                  {getStatusBadge(currentStatus)}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuItem onClick={() => handleStatusChange('on_duty')} className="gap-2 cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  On Duty (In Hospital)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('on_call')} className="gap-2 cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  On Call (Emergency)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in_maintenance')} className="gap-2 cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  In Active Maintenance
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('off_duty')} className="gap-2 cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Off Duty
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Specialization tag */}
        {engineer.specialization && (
          <div className="text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40 truncate">
            <span className="font-medium text-foreground/80">Specialization:</span> {engineer.specialization}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs flex-1 px-4">
        {/* Contact Info Pills */}
        <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/50">
          {engineer.mobileNumber ? (
            <a
              href={`tel:${engineer.mobileNumber}`}
              className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors font-medium truncate"
            >
              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{engineer.mobileNumber}</span>
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>No Mobile</span>
            </div>
          )}

          {engineer.extension ? (
            <div className="flex items-center gap-1.5 text-foreground font-medium truncate justify-end">
              <PhoneCall className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Ext: <strong>{engineer.extension}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
              <span>No Ext.</span>
            </div>
          )}

          <a
            href={`mailto:${engineer.email}`}
            className="col-span-2 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate pt-1 border-t border-border/40 text-[11px]"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{engineer.email}</span>
          </a>
        </div>

        {/* Schedule & Working Days */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Working Days
            </span>
            <span className="text-[11px] text-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {engineer.shiftHours || '08:00 AM - 04:00 PM'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
              const isWorking = engineer.workingDays.includes(day);
              const isOnCall = engineer.onCallDays.includes(day);
              return (
                <span
                  key={day}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                    isWorking
                      ? 'bg-primary/10 text-primary border-primary/20 font-semibold'
                      : isOnCall
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold'
                      : 'bg-muted/30 text-muted-foreground/40 border-transparent'
                  }`}
                  title={isWorking ? 'Regular Working Day' : isOnCall ? 'On-Call Shift' : 'Off'}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </div>

        {/* Covered Departments */}
        <div className="space-y-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Department Coverage ({engineer.coveredDepartments.length})
          </span>
          <div className="flex flex-wrap gap-1">
            {engineer.coveredDepartments.length > 0 ? (
              <>
                {engineer.coveredDepartments.slice(0, 3).map((dept) => {
                  const label = dept.name.includes(dept.code) ? dept.name : `${dept.name} (${dept.code})`;
                  return (
                    <Badge key={dept.id} variant="secondary" className="text-[10px] px-2 py-0.5 font-normal max-w-[200px] truncate" title={label}>
                      {label}
                    </Badge>
                  );
                })}
                {engineer.coveredDepartments.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                    +{engineer.coveredDepartments.length - 3} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-[11px] italic">General hospital coverage</span>
            )}
          </div>
        </div>

        {/* Notes/Expertise */}
        {engineer.notes && (
          <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/40 line-clamp-2">
            {engineer.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-3 px-4 border-t bg-muted/20 text-xs flex justify-between items-center text-muted-foreground mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="Assigned devices">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <strong>{engineer.assignedDevicesCount}</strong> Devices
          </span>
          <span className="flex items-center gap-1" title="Active work orders">
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            <strong>{engineer.activeTicketsCount + engineer.activeMaintenanceCount}</strong> Tasks
          </span>
        </div>

        {engineer.mobileNumber && (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <a href={`tel:${engineer.mobileNumber}`}>
              <Phone className="w-3 h-3 text-emerald-600" />
              Call
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
