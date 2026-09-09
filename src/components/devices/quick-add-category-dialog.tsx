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
import { Textarea } from "@/components/ui/textarea";
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
  triggerLabel = "New Category",
}: QuickAddCategoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [riskClassification, setRiskClassification] = useState<string>("class_iia");
  const [criticalityLevel, setCriticalityLevel] = useState<string>("medium");
  const [defaultPmIntervalDays, setDefaultPmIntervalDays] = useState<string>("180");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === name.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15)) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    if (!code.trim()) {
      setError("Category code is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createDeviceCategory({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        riskClassification: riskClassification as any,
        criticalityLevel: criticalityLevel as any,
        defaultPmIntervalDays: defaultPmIntervalDays ? parseInt(defaultPmIntervalDays, 10) : undefined,
      });

      if (result.success) {
        if (onSuccess) onSuccess((result as any).data);
        router.refresh();
        setOpen(false);
        // Reset form
        setName("");
        setCode("");
        setDescription("");
        setRiskClassification("class_iia");
        setCriticalityLevel("medium");
        setDefaultPmIntervalDays("180");
      } else {
        setError((result as any)?.error || "Failed to create device category");
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
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Device Category</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-2.5 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-3">
            <div>
              <Label htmlFor="cat-name" className="text-xs">Category Name *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Infusion Pump"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="cat-code" className="text-xs">Category Code *</Label>
              <Input
                id="cat-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. INF_PUMP"
                className="mt-1 font-mono text-xs uppercase"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cat-risk" className="text-xs">Risk Classification</Label>
                <select
                  id="cat-risk"
                  value={riskClassification}
                  onChange={(e) => setRiskClassification(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs mt-1"
                >
                  <option value="class_i">Class I (Low Risk)</option>
                  <option value="class_iia">Class IIa (Medium)</option>
                  <option value="class_iib">Class IIb (High)</option>
                  <option value="class_iii">Class III (Critical)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="cat-crit" className="text-xs">Default Criticality</Label>
                <select
                  id="cat-crit"
                  value={criticalityLevel}
                  onChange={(e) => setCriticalityLevel(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs mt-1"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="cat-pm" className="text-xs">Default PM Interval (Days)</Label>
              <Input
                id="cat-pm"
                type="number"
                value={defaultPmIntervalDays}
                onChange={(e) => setDefaultPmIntervalDays(e.target.value)}
                placeholder="180"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="cat-desc" className="text-xs">Description (Optional)</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of device category standards..."
                className="mt-1 text-xs resize-none"
                rows={2}
              />
            </div>
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
              Save Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
