'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MentionTextarea } from './mention-textarea';
import { completeDepartmentVisit, getDepartmentDevices } from '@/lib/actions/engineer-rounds';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface DepartmentVisitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: {
    id: string;
    departmentId: string;
    departmentName: string;
    status: string;
    notes?: { id: string; noteText: string; deviceMentions: any[]; author?: { fullName: string } }[];
    ticketCount?: number;
  } | null;
  roundId: string;
  hospitalId: string;
  onCompleted: () => void;
}

export function DepartmentVisitSheet({
  open,
  onOpenChange,
  visit,
  roundId,
  hospitalId,
  onCompleted,
}: DepartmentVisitSheetProps) {
  const router = useRouter();
  const [noteText, setNoteText] = useState('');
  const [deviceMentions, setDeviceMentions] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Load devices for this department
  useEffect(() => {
    if (visit && open) {
      setLoadingDevices(true);
      getDepartmentDevices(visit.departmentId).then(result => {
        if (result.success) {
          setDevices(result.data || []);
        }
        setLoadingDevices(false);
      });
    }
  }, [visit?.departmentId, open]);

  // Reset form when visit changes
  useEffect(() => {
    if (open) {
      setNoteText('');
      setDeviceMentions([]);
    }
  }, [visit?.id, open]);

  if (!visit) return null;

  const isCompleted = visit.status === 'completed';

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeDepartmentVisit({
        visitId: visit.id,
        noteText: noteText.trim() || undefined,
        deviceMentions,
      });

      if (result.success) {
        toast.success(`${visit.departmentName} completed`);
        onCompleted();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to complete visit');
      }
    });
  };

  const handleReportIssue = () => {
    // Navigate to ticket creation with round context pre-filled
    const params = new URLSearchParams({
      departmentId: visit.departmentId,
      hospitalId,
      roundVisitId: visit.id,
      source: 'department_device_selection',
    });
    router.push(`/tickets/create?${params.toString()}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:max-h-[80vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />
            )}
            {visit.departmentName}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {devices.length} device{devices.length !== 1 ? 's' : ''} in department
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Existing notes */}
          {visit.notes && visit.notes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Previous Notes</h4>
              {visit.notes.map(note => (
                <div key={note.id} className="rounded-md bg-muted/50 p-3 text-sm">
                  <p>{note.noteText}</p>
                  {note.deviceMentions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {note.deviceMentions.map((m: any, i: number) => (
                        <span
                          key={`${m.deviceId}-${i}`}
                          className="inline-flex items-center text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded"
                        >
                          @{m.deviceName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ticket count */}
          {(visit.ticketCount ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              {visit.ticketCount} issue{visit.ticketCount !== 1 ? 's' : ''} reported
            </div>
          )}

          {/* Note input (only if not completed) */}
          {!isCompleted && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <MentionTextarea
                  value={noteText}
                  onChange={(val, mentions) => {
                    setNoteText(val);
                    setDeviceMentions(mentions);
                  }}
                  devices={devices}
                  placeholder='e.g. "All devices working well" or "Issue with @device..."'
                  disabled={isPending}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-12 text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-950/30"
                  onClick={handleReportIssue}
                  disabled={isPending}
                >
                  <AlertTriangle className="h-5 w-5" />
                  Report Issue
                </Button>

                <Button
                  className="w-full h-12 gap-2 text-base"
                  onClick={handleComplete}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  Complete Department
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
