'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  PhoneCall,
  Wrench,
  CheckCircle2,
  Moon,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { EngineerTeamMember } from '@/lib/actions/engineers';
import { EngineerDutyStatus } from '@/lib/db/schema/engineer-profiles';

interface EngineerCardProps {
  engineer: EngineerTeamMember;
  onClick?: (engineer: EngineerTeamMember) => void;
  onEdit?: (engineer: EngineerTeamMember) => void;
}

export function EngineerCard({ engineer, onClick, onEdit }: EngineerCardProps) {
  const getStatusBadge = (status: EngineerDutyStatus) => {
    switch (status) {
      case 'on_duty':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium whitespace-nowrap text-[11px] h-5 px-1.5 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            On Duty
          </Badge>
        );
      case 'on_call':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-medium whitespace-nowrap text-[11px] h-5 px-1.5 shrink-0">
            <PhoneCall className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
            On Call
          </Badge>
        );
      case 'in_maintenance':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 font-medium whitespace-nowrap text-[11px] h-5 px-1.5 shrink-0">
            <Wrench className="w-2.5 h-2.5 text-blue-500" />
            Maintenance
          </Badge>
        );
      case 'off_duty':
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 font-medium whitespace-nowrap text-[11px] h-5 px-1.5 shrink-0">
            <Moon className="w-2.5 h-2.5" />
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

  const statusColor =
    engineer.dutyStatus === 'on_duty'
      ? 'bg-emerald-500'
      : engineer.dutyStatus === 'on_call'
      ? 'bg-amber-500'
      : engineer.dutyStatus === 'in_maintenance'
      ? 'bg-blue-500'
      : 'bg-muted-foreground/30';

  return (
    <Card
      onClick={() => onClick?.(engineer)}
      className="group relative flex flex-col justify-between border-border/70 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden bg-card active:scale-[0.99] select-none p-3.5 gap-3"
    >
      {/* Top Accent Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusColor}`} />

      {/* Main Header Row */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
              {initials}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-background ${statusColor}`}
            />
          </div>

          {/* Name & Title */}
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-sm leading-tight text-foreground truncate group-hover:text-primary transition-colors"
              title={engineer.fullName}
            >
              {engineer.fullName}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {engineer.jobTitle}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {getStatusBadge(engineer.dutyStatus)}
      </div>

      {/* Middle: Specialization or Department chip */}
      <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-[11px]">
        {engineer.specialization ? (
          <span className="inline-flex items-center text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/40 truncate max-w-full">
            {engineer.specialization}
          </span>
        ) : engineer.coveredDepartments.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/40 truncate max-w-full">
            <Building2 className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{engineer.coveredDepartments[0].name}</span>
            {engineer.coveredDepartments.length > 1 && (
              <span className="text-foreground/70 font-medium">+{engineer.coveredDepartments.length - 1}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground italic text-[11px]">Biomedical Team Pool</span>
        )}
      </div>

      {/* Bottom Summary & Quick Action */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1" title="Assigned Devices">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <strong className="text-foreground">{engineer.assignedDevicesCount}</strong> dev
          </span>
          <span className="flex items-center gap-1" title="Active Tasks & Tickets">
            <Wrench className="w-3 h-3 text-blue-600" />
            <strong className="text-foreground">{engineer.activeTicketsCount + engineer.activeMaintenanceCount}</strong> tasks
          </span>
          {engineer.extension && (
            <span className="hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] bg-muted/60 px-1 py-0.2 rounded text-foreground font-medium">
              Ext:{engineer.extension}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {engineer.mobileNumber && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={(e) => e.stopPropagation()}
              title={`Call ${engineer.mobileNumber}`}
            >
              <a href={`tel:${engineer.mobileNumber}`}>
                <Phone className="w-3 h-3" />
              </a>
            </Button>
          )}

          <span className="text-[11px] text-primary font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Details
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Card>
  );
}
