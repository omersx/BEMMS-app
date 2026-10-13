'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Wrench, Stethoscope, ArrowRight } from 'lucide-react';

export type UserTypeSelection = 'engineer' | 'department';

export interface AddUserTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: UserTypeSelection) => void;
}

export function AddUserTypeDialog({
  open,
  onOpenChange,
  onSelect,
}: AddUserTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Add New User
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select the account type you would like to create. Each user type includes tailored permissions and workflow settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Biomedical Engineer Option */}
          <button
            type="button"
            onClick={() => onSelect('engineer')}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-50/40 hover:shadow-md dark:hover:border-blue-500/50 dark:hover:bg-blue-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer"
          >
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/70 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white shadow-xs">
                <Wrench className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
              </div>
              <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Biomedical Engineer
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add an engineer to the biomedical team roster with duty scheduling, department coverage, and technical specialization.
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors">
              <span>Continue as Engineer</span>
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </button>

          {/* Department Staff Option */}
          <button
            type="button"
            onClick={() => onSelect('department')}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-purple-500/50 hover:bg-purple-50/40 hover:shadow-md dark:hover:border-purple-500/50 dark:hover:bg-purple-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 cursor-pointer"
          >
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-950/70 dark:text-purple-400 dark:group-hover:bg-purple-600 dark:group-hover:text-white shadow-xs">
                <Stethoscope className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
              </div>
              <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Department Staff
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add clinical or administrative staff to a hospital department for equipment reporting and ticket management.
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 transition-colors">
              <span>Continue as Staff</span>
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
