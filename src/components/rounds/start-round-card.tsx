'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { startRound } from '@/lib/actions/engineer-rounds';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Building2, Calendar, Clock, MapPin } from 'lucide-react';

interface StartRoundCardProps {
  hospitalId: string;
  hospitalName?: string;
  departments: { id: string; name: string; code: string }[];
  shiftType: string;
}

export function StartRoundCard({
  hospitalId,
  hospitalName,
  departments,
  shiftType,
}: StartRoundCardProps) {
  const router = useRouter();
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleStartRound = () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    startTransition(async () => {
      const result = await startRound({
        hospitalId,
        shiftType,
        password,
      });

      if (result.success) {
        toast.success('Round started! Good luck on your round.');
        setShowSignDialog(false);
        setPassword('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to start round');
      }
    });
  };

  return (
    <>
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Start Daily Round</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>{hospitalName || 'Your Hospital'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="capitalize">{shiftType} Shift</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{departments.length} department{departments.length !== 1 ? 's' : ''} to visit</span>
            </div>
          </div>

          {/* Department Preview */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {departments.map(dept => (
              <span
                key={dept.id}
                className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-md"
              >
                {dept.name}
              </span>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full gap-2 text-base h-12"
            onClick={() => setShowSignDialog(true)}
          >
            <ShieldCheck className="h-5 w-5" />
            Sign &amp; Start Round
          </Button>
        </CardContent>
      </Card>

      {/* E-Signature Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Electronic Signature
            </DialogTitle>
            <DialogDescription>
              Confirm your identity to start the daily engineering round.
              This action will be recorded with your electronic signature.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
              <p><span className="font-medium">Action:</span> Start Daily Engineering Round</p>
              <p><span className="font-medium">Date:</span> {dateStr}</p>
              <p><span className="font-medium">Shift:</span> <span className="capitalize">{shiftType}</span></p>
              <p><span className="font-medium">Departments:</span> {departments.length}</p>
            </div>

            <div>
              <Label htmlFor="sig-password">Enter your password to confirm</Label>
              <Input
                id="sig-password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStartRound();
                }}
                disabled={isPending}
                className="mt-1.5"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSignDialog(false);
                setPassword('');
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartRound}
              disabled={isPending || !password.trim()}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Confirm &amp; Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
