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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { createDeviceCategory } from "@/lib/actions/device-categories";

interface QuickAddCategoryDialogProps {
  onSuccess?: (newCategory: any) => void;
  triggerVariant?: "outline" | "ghost" | "default" | "secondary";
  triggerSize?: "sm" | "default" | "icon";
  triggerLabel?: string;
}

export function QuickAddCategoryDialog({
  onSuccess,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerLabel = "New Type",
}: QuickAddCategoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a device type name");
      return;
    }

    setLoading(true);
    setError("");

    // Auto-generate code from name
    const code = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15);

    try {
      const result = await createDeviceCategory({
        name: name.trim(),
        code,
        criticalityLevel: "medium",
        defaultPmIntervalDays: 180,
      });

      if (result.success) {
        if (onSuccess) onSuccess((result as any).data);
        router.refresh();
        setOpen(false);
        setName("");
      } else {
        setError((result as any)?.error || "Failed to create device type");
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
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className="h-8 gap-1 text-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Device Type</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-2.5 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="cat-name">Device Type Name *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blood Gas Analyzer, Autoclave..."
              className="mt-1"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Enter the general type of equipment (e.g. &quot;Infusion Pump&quot;, &quot;Sterilizer&quot;)
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
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Add Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
