'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2, RotateCcw, ShieldAlert, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { purgeData } from '@/lib/actions/data-management';

export function DangerZone() {
  const [selectedScope, setSelectedScope] = useState<'test_transactions' | 'factory_reset'>('test_transactions');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [purging, setPurging] = useState(false);

  const expectedPhrase = selectedScope === 'test_transactions' ? 'PURGE TEST DATA' : 'RESET ALL DATA';

  const handleOpenDialog = (scope: 'test_transactions' | 'factory_reset') => {
    setSelectedScope(scope);
    setConfirmText('');
    setPassword('');
    setReason('');
    setDialogOpen(true);
  };

  const handleConfirmPurge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmText.trim() !== expectedPhrase) {
      toast.error(`Confirmation phrase must match "${expectedPhrase}" exactly`);
      return;
    }

    if (!password) {
      toast.error('Administrator password is required to re-authenticate');
      return;
    }

    setPurging(true);

    try {
      const res = await purgeData({
        scope: selectedScope,
        confirmText,
        password,
        reason: reason.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || 'Operation executed successfully');
        setDialogOpen(false);
        // Refresh page after a brief delay
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast.error(res.error || 'Failed to execute data reset');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-destructive flex items-center gap-2">
                Danger Zone & Data Purge
              </CardTitle>
              <CardDescription>
                High-friction administrative tools for purging test datasets or resetting the environment prior to clinical launch.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Action 1: Purge Test Data */}
          <div className="p-5 border rounded-lg bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h5 className="font-semibold text-base flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                Purge Test & Transactional Records
              </h5>
              <p className="text-xs text-muted-foreground max-w-xl">
                Deletes all service tickets, sample work orders, and test maintenance logs generated during user training.
                <strong className="text-foreground block mt-1">
                  Preserves: Medical equipment inventory, hospital departments, users, and system roles.
                </strong>
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => handleOpenDialog('test_transactions')}
              className="shrink-0 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Purge Test Data
            </Button>
          </div>

          {/* Action 2: Full Factory Reset */}
          <div className="p-5 border rounded-lg bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h5 className="font-semibold text-base flex items-center gap-2 text-destructive">
                <RotateCcw className="h-4 w-4" />
                Full System Factory Reset
              </h5>
              <p className="text-xs text-muted-foreground max-w-xl">
                Restores the BEMMS application back to its fresh post-installation state. Clears devices, tickets,
                and custom data while re-establishing default system administrative access.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleOpenDialog('factory_reset')}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Factory Reset
            </Button>
          </div>

          {/* Section 16 Regulatory Notice */}
          <div className="p-4 border rounded-lg bg-muted/60 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                FDA 21 CFR Part 11 & BEMMS Section 16 Regulatory Safeguard:
              </p>
              <p>
                In clinical hospital deployments, signed medical equipment maintenance histories are permanent legal records.
                All data purge actions require administrator re-authentication and are permanently recorded in the immutable audit log.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation & Re-auth Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleConfirmPurge}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {selectedScope === 'test_transactions'
                  ? 'Confirm Test Data Purge'
                  : 'Confirm Full Factory Reset'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                This operation is irreversible. Please follow the two-factor safety confirmation steps below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Step 1: Confirmation Phrase */}
              <div className="space-y-2">
                <Label htmlFor="confirmPhrase" className="text-xs font-semibold">
                  1. Type <span className="font-mono text-destructive underline">{expectedPhrase}</span> to confirm:
                </Label>
                <Input
                  id="confirmPhrase"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={expectedPhrase}
                  className="font-mono text-xs"
                  autoComplete="off"
                />
              </div>

              {/* Step 2: Password Re-Authentication */}
              <div className="space-y-2">
                <Label htmlFor="adminPassword" className="text-xs font-semibold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  2. Enter Administrator Password:
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your current account password"
                  autoComplete="current-password"
                />
              </div>

              {/* Step 3: Justification Note */}
              <div className="space-y-2">
                <Label htmlFor="purgeReason" className="text-xs font-semibold">
                  3. Audit Justification Reason:
                </Label>
                <Input
                  id="purgeReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Pre-go-live test data cleanup"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={purging}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={purging || confirmText.trim() !== expectedPhrase || !password}
                className="gap-2"
              >
                {purging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing Purge...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Execute Purge
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
