"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserX, UserCheck, Loader2, AlertTriangle } from "lucide-react";
import { deactivateUser, reactivateUser } from "@/lib/actions/users";

interface UserStatusDialogProps {
  userId: string;
  userName: string;
  currentStatus: "active" | "invited" | "deactivated" | "archived" | string;
}

export function UserStatusDialog({
  userId,
  userName,
  currentStatus,
}: UserStatusDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const isDeactivating = currentStatus === "active";

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeactivating && !reason.trim()) {
      setError("Please provide a reason for deactivating this user (required for 21 CFR Part 11 audit compliance).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = isDeactivating
        ? await deactivateUser(userId, reason.trim())
        : await reactivateUser(userId, reason.trim() || undefined);

      if (result.success) {
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        setError((result as any)?.error || "Failed to update user status");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isDeactivating ? (
          <Button variant="destructive" size="sm" className="min-h-[38px]">
            <UserX className="w-4 h-4 mr-2" />
            Deactivate User
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 min-h-[38px]"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Reactivate User
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleStatusChange} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {isDeactivating ? (
                <div className="p-2 rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              )}
              <DialogTitle>
                {isDeactivating ? `Deactivate ${userName}` : `Reactivate ${userName}`}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              {isDeactivating
                ? "Deactivating will revoke immediate login access while preserving all historical audit logs, digital signatures, and task records."
                : "Reactivating will restore login access and allow role assignments for this user."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-2.5 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status-reason" className="text-xs font-medium">
              {isDeactivating ? "Reason for Deactivation *" : "Notes / Change Reason"}
            </Label>
            <Textarea
              id="status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isDeactivating
                  ? "e.g. Employee departure, temporary suspension, or role transfer..."
                  : "e.g. Returned from leave, reactivation approved..."
              }
              className="text-xs resize-none"
              rows={3}
              required={isDeactivating}
            />
            <p className="text-[11px] text-muted-foreground">
              This note will be permanently recorded in the 21 CFR Part 11 system audit trail.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isDeactivating ? "destructive" : "default"}
              size="sm"
              disabled={loading}
              className={!isDeactivating ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {isDeactivating ? "Confirm Deactivation" : "Confirm Reactivation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
