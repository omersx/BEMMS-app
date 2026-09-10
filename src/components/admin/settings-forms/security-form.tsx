'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateOrganizationSettings } from '@/lib/actions/system-settings';
import type { SecuritySettings } from '@/lib/validators/system-settings';

interface SecurityFormProps {
  initialData: SecuritySettings;
  organizationId: string;
}

export function SecurityForm({ initialData, organizationId }: SecurityFormProps) {
  const [formData, setFormData] = useState<SecuritySettings>(initialData);
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await updateOrganizationSettings({
        organizationId,
        section: 'security',
        settings: formData,
        changeReason: changeReason.trim() || 'Updated security and compliance policies',
      });

      if (res.success) {
        toast.success('Security settings saved successfully');
        setChangeReason('');
      } else {
        toast.error(res.error || 'Failed to update security settings');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Security & 21 CFR Part 11 Compliance
          </CardTitle>
          <CardDescription>
            Configure authentication thresholds, inactivity timeouts, and electronic signature safeguards.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Timeout */}
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Session Inactivity Timeout (Minutes)
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                min={5}
                max={1440}
                value={formData.sessionTimeoutMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sessionTimeoutMinutes: parseInt(e.target.value) || 30 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Inactivity duration before active user sessions are terminated automatically (standard: 15-30m).
              </p>
            </div>

            {/* Password Expiry */}
            <div className="space-y-2">
              <Label htmlFor="passwordExpiry" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Password Expiration Policy (Days)
              </Label>
              <Input
                id="passwordExpiry"
                type="number"
                min={0}
                max={365}
                value={formData.passwordExpiryDays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) || 0 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 to disable automated expiry, or specify hospital policy interval (e.g., 90 days).
              </p>
            </div>

            {/* Max Login Attempts */}
            <div className="space-y-2">
              <Label htmlFor="maxAttempts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Max Failed Login Attempts
              </Label>
              <Input
                id="maxAttempts"
                type="number"
                min={3}
                max={10}
                value={formData.maxLoginAttempts}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Account lockout threshold to prevent brute-force attacks.
              </p>
            </div>

            {/* Re-auth for Signatures */}
            <div className="flex flex-col justify-between space-y-2 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="requireReAuth" className="font-medium text-sm">
                    Re-Authenticate for Electronic Signatures
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enforces password/PIN re-entry when signing maintenance release and calibration records (FDA 21 CFR Part 11).
                  </p>
                </div>
                <Switch
                  id="requireReAuth"
                  checked={formData.requireReAuthForSignatures}
                  onCheckedChange={(val) =>
                    setFormData((prev) => ({ ...prev, requireReAuthForSignatures: val }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Audit Trace Reason */}
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="changeReason" className="text-sm font-medium">
              Change Reason (21 CFR Part 11 Audit Trace)
            </Label>
            <Input
              id="changeReason"
              placeholder="e.g., Hospital IT security policy annual review"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="max-w-xl"
            />
            <p className="text-xs text-muted-foreground">
              Required reason for modifying clinical and infrastructure security parameters.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Security Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
