'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getStaffStatus, getStaffStatusStyle } from '@/lib/utils/staff-status';
import {
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { addTicketComment } from '@/lib/actions/tickets';

interface StaffTicketProgressTrackerProps {
  ticket: {
    id: string;
    ticketNumber: string;
    statusCode: string;
    reportedAt?: Date | string | null;
    createdAt?: Date | string | null;
    resolvedAt?: Date | string | null;
    waitingReason?: string | null;
    waitingDependencyType?: string | null;
    assignedEngineerUserId?: string | null;
    assignedEngineer?: {
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
    finalDeviceStatusCode?: string | null;
    resolutionSummary?: string | null;
  };
  engineerContact?: {
    mobileNumber?: string | null;
    extension?: string | null;
    dutyStatus?: string | null;
  } | null;
}

interface Step {
  id: string;
  label: string;
  sublabel: string;
  status: 'complete' | 'current' | 'upcoming' | 'alert';
}

export function StaffTicketProgressTracker({
  ticket,
  engineerContact,
}: StaffTicketProgressTrackerProps) {
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const statusInfo = getStaffStatus(ticket.statusCode);
  const statusStyle = getStaffStatusStyle(ticket.statusCode);

  const isResolved = ['resolved', 'closed'].includes(ticket.statusCode);
  const isWaitingParts = ticket.statusCode === 'waiting_parts_vendor';
  const isWaitingResponse = ticket.statusCode === 'waiting_requester';

  // Compute 5 linear steps for clinical staff
  const steps: Step[] = useMemo(() => {
    // Stage 1: Submitted
    // Stage 2: Reviewed
    // Stage 3: Assigned to Engineer
    // Stage 4: In Repair / Hold
    // Stage 5: Resolved

    const code = ticket.statusCode;

    let s1: Step['status'] = 'complete';
    let s2: Step['status'] = 'upcoming';
    let s3: Step['status'] = 'upcoming';
    let s4: Step['status'] = 'upcoming';
    let s5: Step['status'] = 'upcoming';

    if (code === 'new') {
      s1 = 'complete';
      s2 = 'current';
    } else if (code === 'acknowledged' || code === 'in_triage') {
      s1 = 'complete';
      s2 = 'complete';
      s3 = 'current';
    } else if (code === 'assigned') {
      s1 = 'complete';
      s2 = 'complete';
      s3 = 'complete';
      s4 = 'current';
    } else if (code === 'in_progress') {
      s1 = 'complete';
      s2 = 'complete';
      s3 = 'complete';
      s4 = 'current';
    } else if (code === 'waiting_parts_vendor') {
      s1 = 'complete';
      s2 = 'complete';
      s3 = 'complete';
      s4 = 'alert';
    } else if (code === 'waiting_requester') {
      s1 = 'complete';
      s2 = 'complete';
      s3 = 'complete';
      s4 = 'alert';
    } else if (isResolved) {
      s1 = 'complete';
      s2 = 'complete';
      s3 = 'complete';
      s4 = 'complete';
      s5 = 'complete';
    }

    return [
      {
        id: '1',
        label: '1. Submitted',
        sublabel: ticket.reportedAt
          ? new Date(ticket.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
          : 'Logged',
        status: s1,
      },
      {
        id: '2',
        label: '2. Reviewed',
        sublabel: 'Biomedical Triage',
        status: s2,
      },
      {
        id: '3',
        label: '3. Assigned',
        sublabel: ticket.assignedEngineer?.fullName
          ? ticket.assignedEngineer.fullName.split(' ')[0]
          : 'Pending engineer',
        status: s3,
      },
      {
        id: '4',
        label: isWaitingParts
          ? '4. Parts On Order'
          : isWaitingResponse
          ? '4. Needs Reply'
          : '4. Being Repaired',
        sublabel: isWaitingParts
          ? 'Waiting parts'
          : isWaitingResponse
          ? 'Doctor reply needed'
          : 'Active repair',
        status: s4,
      },
      {
        id: '5',
        label: '5. Resolved',
        sublabel: isResolved ? 'Ready for clinical use' : 'Pending testing',
        status: s5,
      },
    ];
  }, [ticket.statusCode, ticket.reportedAt, ticket.assignedEngineer, isWaitingParts, isWaitingResponse, isResolved]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    const res = await addTicketComment(ticket.id, {
      body: replyText.trim(),
      visibility: 'public',
    });
    if (res?.success) {
      setReplySuccess(true);
      setReplyText('');
    }
    setSubmittingReply(false);
  };

  return (
    <div className="space-y-4">
      {/* ── Visual Stepper Bar ─────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border/60">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Repair Progress Tracker
            </span>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 mt-0.5">
              <span>{statusInfo.icon}</span>
              <span>{statusInfo.label}</span>
            </h3>
          </div>
          <span
            className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium border',
              statusStyle.bg,
              statusStyle.text,
              statusStyle.border
            )}
          >
            {statusInfo.description || statusInfo.label}
          </span>
        </div>

        {/* Stepper Dots & Line */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'complete';
            const isCurrent = step.status === 'current';
            const isAlert = step.status === 'alert';

            return (
              <div key={step.id} className="flex flex-col items-center text-center relative group">
                {/* Connecting Line between steps */}
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'hidden sm:block absolute top-3.5 left-1/2 w-full h-0.5 -z-0',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative z-10',
                    isCompleted && 'bg-primary text-primary-foreground shadow-sm',
                    isCurrent && 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 animate-pulse',
                    isAlert && 'bg-amber-500 text-white ring-4 ring-amber-500/20 shadow-sm animate-bounce',
                    step.status === 'upcoming' && 'bg-muted text-muted-foreground border'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isAlert ? (
                    '!'
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 min-w-0 px-0.5">
                  <p
                    className={cn(
                      'text-[11px] sm:text-xs font-semibold truncate leading-tight',
                      (isCurrent || isAlert) && 'text-primary font-bold',
                      isCompleted && 'text-foreground',
                      step.status === 'upcoming' && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate hidden sm:block mt-0.5">
                    {step.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Status-Specific Clinical Guidance Cards ────────────────────── */}

      {/* 1. If Waiting for Response from Staff */}
      {isWaitingResponse && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-xl">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                Biomedical Engineering has asked a question
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
                The technician needs more details from the ward staff to proceed with repairing this device. Please provide the requested answer below.
              </p>
            </div>
          </div>

          {replySuccess ? (
            <div className="p-3 bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Thank you! Your reply was sent directly to the biomedical team.
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <Textarea
                placeholder="Type your response to the engineer here (e.g. 'Yes, the alarm was sounding every 30 seconds from pump channel 2')..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                className="bg-card text-xs sm:text-sm"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSendReply}
                  disabled={submittingReply || !replyText.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReply ? 'Sending...' : 'Send Answer to Engineer'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. If Waiting for Spare Parts */}
      {isWaitingParts && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-950 dark:text-amber-100">
              Spare Parts On Order
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Required component: <strong className="text-foreground">{ticket.waitingReason || 'Replacement part ordered from vendor'}</strong>.
              Repair will resume as soon as the package arrives at the hospital biomedical workshop.
            </p>
          </div>
        </div>
      )}

      {/* 3. If Assigned to Engineer */}
      {ticket.assignedEngineer?.fullName && (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center shrink-0">
              {ticket.assignedEngineer.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-foreground">
                  {ticket.assignedEngineer.fullName}
                </h4>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.2 rounded font-medium">
                  Assigned Engineer
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Biomedical Engineering · Handling your device repair
              </p>
            </div>
          </div>

          {/* Quick Call & Email actions */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
            {(engineerContact?.extension || engineerContact?.mobileNumber || ticket.assignedEngineer.phone) && (
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-card">
                <a
                  href={`tel:${
                    engineerContact?.mobileNumber ||
                    engineerContact?.extension ||
                    ticket.assignedEngineer.phone
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                  <span>Call {engineerContact?.extension ? `Ext. ${engineerContact.extension}` : 'Engineer'}</span>
                </a>
              </Button>
            )}
            {ticket.assignedEngineer.email && (
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-card">
                <a href={`mailto:${ticket.assignedEngineer.email}`}>
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 4. If Resolved */}
      {isResolved && (
        <div className="bg-green-50/70 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 shadow-sm flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-green-950 dark:text-green-100">
              Equipment Tested & Cleared for Clinical Use
            </h4>
            <p className="text-xs text-green-800 dark:text-green-300 mt-0.5 leading-relaxed">
              Biomedical repair work is complete. The equipment has passed functional safety testing and is safe for bedside deployment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
