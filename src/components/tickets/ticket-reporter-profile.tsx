'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Phone,
  Mail,
  Building2,
  Stethoscope,
  IdCard,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ReporterInfo {
  id?: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  employeeIdentifier?: string | null;
  departmentName?: string | null;
  hospitalName?: string | null;
  reportedLocationCorrection?: string | null;
  requesterContactName?: string | null;
  requesterContactPhone?: string | null;
}

interface TicketReporterProfileProps {
  reporter: ReporterInfo;
  isBiomedOrAdmin?: boolean;
}

export function TicketReporterProfile({
  reporter,
  isBiomedOrAdmin = false,
}: TicketReporterProfileProps) {
  const [open, setOpen] = useState(false);

  const name = reporter.fullName || reporter.requesterContactName || 'Unknown Reporter';
  const jobTitle = reporter.jobTitle || 'Department Clinical Staff';
  const phone = reporter.requesterContactPhone || reporter.phone;
  const extension = reporter.employeeIdentifier;
  const department = reporter.departmentName || 'Hospital Department';
  const hospital = reporter.hospitalName || 'Hospital';

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-3">
      {/* ── Reporter Summary Card in Sidebar ──────────────────────────── */}
      <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 border">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <Stethoscope className="w-3 h-3 text-primary shrink-0" />
              <span>{jobTitle}</span>
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {department}
            </p>
          </div>
        </div>

        {/* Quick Call & Email actions */}
        <div className="space-y-1.5 pt-2 border-t text-xs">
          {phone && (
            <div className="flex items-center justify-between p-1 rounded-md hover:bg-muted/50 transition">
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="text-[11px] text-muted-foreground shrink-0">Phone:</span>
                <span className="truncate font-medium text-foreground">{phone}</span>
              </div>
              {phone.match(/\d/) && (
                <a
                  href={`tel:${phone}`}
                  className="text-xs text-primary font-semibold hover:underline px-1.5 py-0.5 rounded bg-primary/10 shrink-0 ml-1"
                >
                  Call
                </a>
              )}
            </div>
          )}

          {extension && extension !== phone && (
            <div className="flex items-center gap-2 p-1 text-muted-foreground">
              <IdCard className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] shrink-0">Staff ID:</span>
              <span className="truncate font-medium text-foreground">{extension}</span>
            </div>
          )}

          {reporter.email && (
            <a
              href={`mailto:${reporter.email}`}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-muted text-primary font-medium transition"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{reporter.email}</span>
            </a>
          )}
        </div>

        {/* Dialog Trigger to view full reporter details */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8 gap-1.5 bg-card mt-1"
            >
              <User className="w-3.5 h-3.5" />
              View Full Reporter Info
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-primary" />
                Department Reporter Information
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Header profile */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/30 border">
                <Avatar className="h-12 w-12 border shadow-sm">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-base text-foreground">{name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                    <Stethoscope className="w-3.5 h-3.5 text-primary" />
                    {jobTitle}
                  </p>
                </div>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Department
                  </span>
                  <p className="font-semibold text-foreground">{department}</p>
                </div>

                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Hospital
                  </span>
                  <p className="font-semibold text-foreground">{hospital}</p>
                </div>

                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Contact Phone
                  </span>
                  <p className="font-medium text-foreground">
                    {phone ? (
                      <a href={`tel:${phone}`} className="text-primary hover:underline">
                        {phone}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Hospital Extension / Ward
                  </span>
                  <p className="font-medium text-foreground">{extension || 'Not provided'}</p>
                </div>
              </div>

              {reporter.email && (
                <div className="p-3 rounded-xl border bg-card text-xs space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Official Email
                  </span>
                  <p className="font-medium text-foreground">
                    <a href={`mailto:${reporter.email}`} className="text-primary hover:underline">
                      {reporter.email}
                    </a>
                  </p>
                </div>
              )}

              {reporter.reportedLocationCorrection && (
                <div className="p-3 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-xs space-y-1">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Reported Room / Bed Location
                  </span>
                  <p className="font-medium text-amber-950 dark:text-amber-100">
                    {reporter.reportedLocationCorrection}
                  </p>
                </div>
              )}

              {/* Direct call action */}
              {phone && (
                <div className="pt-2">
                  <Button asChild className="w-full gap-2">
                    <a href={`tel:${phone}`}>
                      <Phone className="w-4 h-4" />
                      Call Reporter Now ({phone})
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
