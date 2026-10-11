'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateCurrentUserProfile, DepartmentStaffProfile } from '@/lib/actions/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  IdCard,
  TicketCheck,
  CheckCircle,
  Save,
  Loader2,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface UserProfileViewProps {
  profile: DepartmentStaffProfile;
}

const COMMON_SPECIALTIES = [
  'Staff Nurse',
  'Charge Nurse',
  'ICU Specialist',
  'Operating Theatre Nurse',
  'Ward Medical Officer',
  'Clinical Consultant',
  'Department Head / Supervisor',
  'Dialysis Technician',
];

export function UserProfileView({ profile }: UserProfileViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [employeeIdentifier, setEmployeeIdentifier] = useState(profile.employeeIdentifier || '');

  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await updateCurrentUserProfile({
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        phone: phone.trim() || undefined,
        employeeIdentifier: employeeIdentifier.trim() || undefined,
      });

      if (res.success) {
        toast.success('Profile updated successfully');
        setEditing(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Identity & Overview Card ───────────────────────────────── */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground">{profile.fullName}</h2>
                  {profile.roles.map((r) => (
                    <Badge key={r} variant="secondary" className="text-[10px] font-semibold">
                      {r.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  {profile.jobTitle || 'Clinical Staff Member'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.departmentName ? `${profile.departmentName} · ` : ''}
                  {profile.hospitalName || 'Assigned Hospital'}
                </p>
              </div>
            </div>

            <Button
              variant={editing ? 'outline' : 'default'}
              size="sm"
              onClick={() => setEditing(!editing)}
              className="shrink-0"
            >
              {editing ? 'Cancel' : 'Edit Contact & Title'}
            </Button>
          </div>
        </div>

        {/* Quick Contact & Scope Strip */}
        <CardContent className="p-4 grid sm:grid-cols-3 gap-3 text-xs bg-card">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border">
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="block text-[10px] text-muted-foreground font-semibold uppercase">
                Contact Phone / Ext.
              </span>
              <span className="font-medium text-foreground truncate">
                {profile.phone || 'Not set (add phone)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="block text-[10px] text-muted-foreground font-semibold uppercase">
                Official Email
              </span>
              <span className="font-medium text-foreground truncate">{profile.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border">
            <IdCard className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="block text-[10px] text-muted-foreground font-semibold uppercase">
                Staff Badge / Extension
              </span>
              <span className="font-medium text-foreground truncate">
                {profile.employeeIdentifier || 'Not registered'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Edit Profile Form (When Editing) ────────────────────────── */}
      {editing ? (
        <Card className="border-2 border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Update Clinical Contact Details
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              This information is visible to biomedical engineers when you report equipment problems.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Hospital & Department are pre-assigned:</span>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                  You are registered under <strong>{profile.departmentName || 'Your Department'}</strong> at <strong>{profile.hospitalName || 'Your Hospital'}</strong>. No hospital or department entry is required. You only need to verify your name, clinical speciality, and direct phone so engineers can contact you.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-xs font-semibold">
                  Full Display Name *
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Al-Mansoor"
                  required
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="jobTitle" className="text-xs font-semibold">
                  Clinical Job Title / Speciality *
                </Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Charge Nurse - Intensive Care"
                  className="mt-1 text-sm"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-muted-foreground self-center mr-1">Suggestions:</span>
                  {COMMON_SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setJobTitle(spec)}
                      className="text-[10px] px-2 py-0.5 rounded-md border bg-muted/40 hover:bg-primary/10 hover:text-primary transition"
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Direct Contact Phone / Mobile
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +966 50 123 4567"
                    className="mt-1 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Used by technicians to call you for urgent device triage.
                  </p>
                </div>

                <div>
                  <Label htmlFor="employeeIdentifier" className="text-xs font-semibold">
                    Hospital Extension / Ward Bleep
                  </Label>
                  <Input
                    id="employeeIdentifier"
                    value={employeeIdentifier}
                    onChange={(e) => setEmployeeIdentifier(e.target.value)}
                    placeholder="e.g. Ext. 3120 (Nurse Station Bed 4)"
                    className="mt-1 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Your ward extension or internal bleep number.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* ── 3. Department & Hospital Assignment Card ──────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Hospital & Department Scope
            </CardTitle>
            <Badge variant="outline" className="text-[10px] text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 font-medium">
              🔒 Pre-assigned & Verified
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pre-assigned by Hospital Administration. Clinical staff do not need to configure or enter hospital locations.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Assigned Hospital
              </span>
              <p className="font-bold text-foreground text-base">
                {profile.hospitalName || 'General Hospital'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Primary Clinical Department
              </span>
              <p className="font-bold text-foreground text-base">
                {profile.departmentName || 'All Assigned Departments'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-foreground">Zero-Config Clinical Routing:</span>
              <p className="text-[11px] mt-0.5">
                Whenever you report a problem or scan an asset, BEMMS automatically connects your report to {profile.departmentName || 'your department'} without requiring any hospital or department codes.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>
                Authorized to view equipment and report issues for {profile.departmentName || 'your department'}.
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs self-start sm:self-auto">
              <Link href="/my-department">View Department Equipment →</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. My Reported Activity Card ──────────────────────────────── */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TicketCheck className="w-4 h-4 text-primary" />
            My Helpdesk Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {profile.activeTicketsCount > 0
                ? `${profile.activeTicketsCount} active ticket(s) currently open`
                : 'No active tickets currently open'}
            </p>
            <p className="text-xs text-muted-foreground">
              Track real-time repair progress, spare parts arrivals, and engineer assignments.
            </p>
          </div>

          <Button asChild size="sm" className="shrink-0">
            <Link href="/tickets">View My Tickets</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
