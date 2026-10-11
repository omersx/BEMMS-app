'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  ExternalLink,
  Shield,
  Radio,
  FileText,
} from 'lucide-react';
import { EngineerTeamMember, updateEngineerDutyStatus } from '@/lib/actions/engineers';
import { EngineerDutyStatus } from '@/lib/db/schema/engineer-profiles';
import { toast } from 'sonner';
import Link from 'next/link';

interface EngineerDetailsDialogProps {
  engineer: EngineerTeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (engineer: EngineerTeamMember) => void;
  onStatusUpdated?: () => void;
}

export function EngineerDetailsDialog({
  engineer,
  open,
  onOpenChange,
  onEdit,
  onStatusUpdated,
}: EngineerDetailsDialogProps) {
  if (!engineer) return null;

  const [currentStatus, setCurrentStatus] = useState<EngineerDutyStatus>(engineer.dutyStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sync state if engineer changes
  if (engineer.dutyStatus !== currentStatus && !isUpdatingStatus) {
    setCurrentStatus(engineer.dutyStatus);
  }

  const handleStatusChange = async (newStatus: EngineerDutyStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateEngineerDutyStatus(engineer.id, newStatus);
      if (res.success) {
        setCurrentStatus(newStatus);
        toast.success(`Duty status updated to ${formatStatus(newStatus)}`);
        onStatusUpdated?.();
      } else {
        toast.error(res.error || 'Failed to update duty status');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdatingStatus(false);
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
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium whitespace-nowrap text-xs h-6 px-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            On Duty (In Hospital)
          </Badge>
        );
      case 'on_call':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 font-medium whitespace-nowrap text-xs h-6 px-2.5">
            <PhoneCall className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            On Call (Emergency)
          </Badge>
        );
      case 'in_maintenance':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1.5 font-medium whitespace-nowrap text-xs h-6 px-2.5">
            <Wrench className="w-3.5 h-3.5 text-blue-500" />
            In Active Maintenance
          </Badge>
        );
      case 'off_duty':
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1.5 font-medium whitespace-nowrap text-xs h-6 px-2.5">
            <Moon className="w-3.5 h-3.5" />
            Off Duty / Rest
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

  const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Top Status Accent Bar */}
        <div
          className={`h-2 w-full ${
            currentStatus === 'on_duty'
              ? 'bg-emerald-500'
              : currentStatus === 'on_call'
              ? 'bg-amber-500'
              : currentStatus === 'in_maintenance'
              ? 'bg-blue-500'
              : 'bg-muted-foreground/30'
          }`}
        />

        {/* Dialog Header */}
        <div className="p-6 pb-4 border-b bg-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center border-2 border-primary/20 shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground leading-tight">
                    {engineer.fullName}
                  </h2>
                </div>
                <p className="text-xs font-medium text-primary mt-0.5">{engineer.jobTitle}</p>
                {engineer.specialization && (
                  <Badge variant="secondary" className="text-[11px] font-normal mt-1.5 px-2 py-0.5">
                    {engineer.specialization}
                  </Badge>
                )}
              </div>
            </div>

            {/* Duty Status Selector & Edit */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 hover:bg-muted/80 cursor-pointer border" disabled={isUpdatingStatus}>
                    {getStatusBadge(currentStatus)}
                    <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 text-xs">
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

              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(engineer);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Schedule
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* 1. Contact Information Row */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Contact & Direct Channels
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Mobile */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Direct Mobile
                </span>
                {engineer.mobileNumber ? (
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <span className="font-semibold text-foreground text-xs">{engineer.mobileNumber}</span>
                    <Button asChild size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-primary">
                      <a href={`tel:${engineer.mobileNumber}`}>Call</a>
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic text-xs">Not provided</span>
                )}
              </div>

              {/* Extension */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                  <PhoneCall className="w-3.5 h-3.5 text-primary" />
                  Hospital Extension
                </span>
                <div className="mt-1">
                  {engineer.extension ? (
                    <span className="font-bold text-foreground text-sm font-mono">{engineer.extension}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">No extension</span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Email Address
                </span>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <span className="font-medium text-foreground text-xs truncate" title={engineer.email}>
                    {engineer.email}
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-primary">
                    <a href={`mailto:${engineer.email}`}>Email</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Workload & Responsibilities Stats */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Assigned Workload & Responsibility
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {engineer.assignedDevicesCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Assigned Devices
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  {engineer.activeTicketsCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <Wrench className="w-3 h-3 text-blue-600" />
                  Active Tickets
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  {engineer.activeMaintenanceCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  PM Tasks
                </p>
              </div>
            </div>
          </div>

          {/* 3. Shift Schedule & Working Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Working Days & Shift Schedule
              </h4>
              <Badge variant="outline" className="text-[11px] gap-1 font-mono">
                <Clock className="w-3 h-3 text-primary" />
                {engineer.shiftHours || '08:00 AM - 04:00 PM'}
              </Badge>
            </div>

            <div className="grid grid-cols-7 gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
              {ALL_DAYS.map((day) => {
                const isWorking = engineer.workingDays.includes(day);
                const isOnCall = engineer.onCallDays.includes(day);
                return (
                  <div
                    key={day}
                    className={`py-2 px-1 text-center rounded-md border text-xs flex flex-col items-center justify-between min-h-[52px] ${
                      isWorking
                        ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-xs'
                        : isOnCall
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold'
                        : 'bg-background/60 border-border/40 text-muted-foreground/50'
                    }`}
                  >
                    <span className="text-[11px]">{day}</span>
                    <span className="text-[10px] mt-0.5 font-normal">
                      {isWorking ? '🟢 Shift' : isOnCall ? '📞 Call' : 'Off'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Department Coverage */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Department Coverage ({engineer.coveredDepartments.length})</span>
              {engineer.hospitalName && (
                <span className="text-muted-foreground font-normal normal-case">{engineer.hospitalName}</span>
              )}
            </h4>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
              {engineer.coveredDepartments.length > 0 ? (
                engineer.coveredDepartments.map((dept) => {
                  const label = dept.name.includes(dept.code) ? dept.name : `${dept.name} (${dept.code})`;
                  return (
                    <Badge
                      key={dept.id}
                      variant="secondary"
                      className="text-xs px-2.5 py-1 font-normal flex items-center gap-1.5"
                    >
                      <Building2 className="w-3 h-3 text-primary" />
                      {label}
                    </Badge>
                  );
                })
              ) : (
                <span className="text-muted-foreground italic text-xs">
                  Assigned to hospital general biomedical pool
                </span>
              )}
            </div>
          </div>

          {/* 5. Notes & Qualifications */}
          {engineer.notes && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Notes & Clinical Qualifications
              </h4>
              <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border/50 leading-relaxed whitespace-pre-wrap">
                {engineer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-row justify-between items-center sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {engineer.mobileNumber && (
              <Button asChild size="sm" className="gap-1.5">
                <a href={`tel:${engineer.mobileNumber}`}>
                  <Phone className="w-3.5 h-3.5" />
                  Call Engineer
                </a>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
