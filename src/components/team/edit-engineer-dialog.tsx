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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EngineerTeamMember, updateEngineerProfile } from '@/lib/actions/engineers';
import { toast } from 'sonner';

interface EditEngineerDialogProps {
  engineer: EngineerTeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EditEngineerDialog({
  engineer,
  open,
  onOpenChange,
  onSuccess,
}: EditEngineerDialogProps) {
  if (!engineer) return null;

  const [jobTitle, setJobTitle] = useState(engineer.jobTitle);
  const [specialization, setSpecialization] = useState(engineer.specialization || '');
  const [extension, setExtension] = useState(engineer.extension || '');
  const [mobileNumber, setMobileNumber] = useState(engineer.mobileNumber || '');
  const [shiftHours, setShiftHours] = useState(engineer.shiftHours || '08:00 AM - 04:00 PM');
  const [workingDays, setWorkingDays] = useState<string[]>(engineer.workingDays || []);
  const [onCallDays, setOnCallDays] = useState<string[]>(engineer.onCallDays || []);
  const [notes, setNotes] = useState(engineer.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleWorkingDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleOnCallDay = (day: string) => {
    setOnCallDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await updateEngineerProfile(engineer.id, {
        jobTitle,
        specialization,
        extension,
        mobileNumber,
        shiftHours,
        workingDays,
        onCallDays,
        notes,
      });

      if (res.success) {
        toast.success(`Updated profile for ${engineer.fullName}`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || 'Failed to update engineer profile');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Engineer Schedule & Info</DialogTitle>
          <DialogDescription>
            Update contact info, shift hours, and working days for <strong>{engineer.fullName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Job Title</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Lead Biomedical Engineer"
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Specialization</Label>
              <Input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Critical Care Systems"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Internal Phone Extension</Label>
              <Input
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
                placeholder="e.g. 201"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Direct Mobile Number</Label>
              <Input
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. +249 91 234 5678"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Shift Hours</Label>
            <Input
              value={shiftHours}
              onChange={(e) => setShiftHours(e.target.value)}
              placeholder="e.g. 08:00 AM - 04:00 PM"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Scheduled Working Days (On-Site)</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((day) => {
                const checked = workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleWorkingDay(day)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      checked
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Emergency On-Call Days</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((day) => {
                const checked = onCallDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleOnCallDay(day)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      checked
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted'
                    }`}
                  >
                    {day} 📞
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Clinical Engineering Notes / Certifications</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lead responder for OR 1 & 2. Certified on Dräger anesthesia workstations."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
