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
import { createManufacturer } from "@/lib/actions/manufacturers";

interface QuickAddManufacturerDialogProps {
  onSuccess?: (newManufacturer: any) => void;
  triggerVariant?: "outline" | "ghost" | "default" | "secondary";
  triggerSize?: "sm" | "default" | "icon";
  triggerLabel?: string;
}

export function QuickAddManufacturerDialog({
  onSuccess,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerLabel = "New Manufacturer",
}: QuickAddManufacturerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [website, setWebsite] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === name.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15)) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Manufacturer name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createManufacturer({
        name: name.trim(),
        code: code.trim() || undefined,
        country: country.trim() || undefined,
        supportPhone: supportPhone.trim() || undefined,
        supportEmail: supportEmail.trim() || undefined,
        website: website.trim() || undefined,
      });

      if (result.success) {
        if (onSuccess) onSuccess((result as any).data);
        router.refresh();
        setOpen(false);
        // Reset form
        setName("");
        setCode("");
        setCountry("");
        setSupportPhone("");
        setSupportEmail("");
        setWebsite("");
      } else {
        setError((result as any)?.error || "Failed to create manufacturer");
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
            <DialogTitle>Add Device Manufacturer</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-2.5 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-3">
            <div>
              <Label htmlFor="mfr-name" className="text-xs">Manufacturer Name *</Label>
              <Input
                id="mfr-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Philips Healthcare"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mfr-code" className="text-xs">Short Code</Label>
                <Input
                  id="mfr-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. PHILIPS"
                  className="mt-1 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <Label htmlFor="mfr-country" className="text-xs">Country of Origin</Label>
                <Input
                  id="mfr-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Netherlands"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mfr-phone" className="text-xs">Support Phone</Label>
                <Input
                  id="mfr-phone"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+1-800-..."
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="mfr-email" className="text-xs">Support Email</Label>
                <Input
                  id="mfr-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@..."
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mfr-web" className="text-xs">Official Website</Label>
              <Input
                id="mfr-web"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="mt-1 text-xs"
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
              Save Manufacturer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
