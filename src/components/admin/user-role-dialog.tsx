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
import { Plus, Trash2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { assignUserRole, revokeUserRole } from "@/lib/actions/users";

interface RoleOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

interface AssignedRole {
  id: string;
  assignmentId: string;
  code: string;
  name: string;
  description?: string | null;
}

interface UserRoleDialogProps {
  userId: string;
  assignedRoles: AssignedRole[];
  availableRoles: RoleOption[];
}

export function UserRoleDialog({
  userId,
  assignedRoles,
  availableRoles,
}: UserRoleDialogProps) {
  const router = useRouter();

  // Assign Role State
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Revoke Role State
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [roleToRevoke, setRoleToRevoke] = useState<AssignedRole | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState("");

  // Filter out roles already assigned
  const unassignedRoles = availableRoles.filter(
    (role) => !assignedRoles.some((ar) => ar.id === role.id || ar.code === role.code)
  );

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setAssignError("Please select a role to assign.");
      return;
    }

    setAssignLoading(true);
    setAssignError("");

    try {
      const result = await assignUserRole({
        userId,
        roleId: selectedRoleId,
      });

      if (result.success) {
        setAssignOpen(false);
        setSelectedRoleId("");
        router.refresh();
      } else {
        setAssignError((result as any)?.error || "Failed to assign role");
      }
    } catch (err: any) {
      setAssignError(err?.message || "An unexpected error occurred");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRevokeRole = async () => {
    if (!roleToRevoke) return;

    setRevokeLoading(true);
    setRevokeError("");

    try {
      const result = await revokeUserRole(roleToRevoke.assignmentId);

      if (result.success) {
        setRevokeOpen(false);
        setRoleToRevoke(null);
        router.refresh();
      } else {
        setRevokeError((result as any)?.error || "Failed to revoke role");
      }
    } catch (err: any) {
      setRevokeError(err?.message || "An unexpected error occurred");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Assign Role Trigger ── */}
      <div className="flex justify-end">
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 min-h-[36px]">
              <Plus className="w-4 h-4" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <form onSubmit={handleAssignRole} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Assign System Role
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Grant operational or administrative access permissions to this user.
                </DialogDescription>
              </DialogHeader>

              {assignError && (
                <div className="bg-destructive/10 text-destructive text-xs p-2.5 rounded-md border border-destructive/20">
                  {assignError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role-select" className="text-xs font-medium">
                  Select Role *
                </Label>
                {unassignedRoles.length > 0 ? (
                  <select
                    id="role-select"
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Choose a role...</option>
                    {unassignedRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} ({role.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-2 border rounded bg-muted/20">
                    All available system roles have already been assigned to this user.
                  </p>
                )}

                {selectedRoleId && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {unassignedRoles.find((r) => r.id === selectedRoleId)?.description}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignOpen(false)}
                  disabled={assignLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={assignLoading || unassignedRoles.length === 0}
                >
                  {assignLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Confirm Assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Assigned Roles List ── */}
      {assignedRoles.length > 0 ? (
        <div className="space-y-3">
          {assignedRoles.map((role) => (
            <div
              key={role.assignmentId || role.id}
              className="flex items-center justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
            >
              <div className="space-y-0.5 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{role.name}</span>
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                    {role.code}
                  </span>
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 h-8 gap-1 text-xs"
                onClick={() => {
                  setRoleToRevoke(role);
                  setRevokeOpen(true);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Revoke
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          No roles assigned yet. Click "Assign Role" above to grant permissions.
        </div>
      )}

      {/* ── Revoke Confirmation Dialog ── */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <DialogTitle>Revoke Role</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to revoke the{" "}
              <strong className="text-foreground">{roleToRevoke?.name}</strong> role? The user will
              immediately lose the privileges associated with this role.
            </DialogDescription>
          </DialogHeader>

          {revokeError && (
            <div className="bg-destructive/10 text-destructive text-xs p-2.5 rounded-md border border-destructive/20">
              {revokeError}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevokeOpen(false)}
              disabled={revokeLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRevokeRole}
              disabled={revokeLoading}
            >
              {revokeLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Confirm Revocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
