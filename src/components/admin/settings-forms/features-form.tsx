'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sliders, Route, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateOrganizationSettings } from '@/lib/actions/system-settings';
import type { FeaturesSettings } from '@/lib/validators/system-settings';

interface FeaturesFormProps {
  initialData?: FeaturesSettings;
  organizationId: string;
}

export function FeaturesForm({ initialData, organizationId }: FeaturesFormProps) {
  const [formData, setFormData] = useState<FeaturesSettings>(
    initialData || { engineerRoundEnabled: false }
  );
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await updateOrganizationSettings({
        organizationId,
        section: 'features',
        settings: formData,
        changeReason: changeReason.trim() || 'Updated optional feature toggles',
      });

      if (res.success) {
        toast.success('Feature settings saved successfully');
        setChangeReason('');
      } else {
        toast.error(res.error || 'Failed to update feature settings');
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
            <Sliders className="h-5 w-5 text-primary" />
            Optional Module & Feature Toggles
          </CardTitle>
          <CardDescription>
            Enable or deactivate optional modules and workflows to tailor BEMMS to your hospital&apos;s operations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-1 rounded-md bg-primary/10 p-2 text-primary">
                  <Route className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="engineerRoundEnabled" className="text-base font-semibold cursor-pointer">
                    Engineer&apos;s Daily Round
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Digitize the daily physical walk-through performed by biomedical engineers across hospital
                    departments with electronic signatures, to-do checklists, notes with @device mentions, and round history tracking.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    When disabled, the Daily Round menu items and scheduling will be hidden.
                  </p>
                </div>
              </div>

              <Switch
                id="engineerRoundEnabled"
                checked={formData.engineerRoundEnabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, engineerRoundEnabled: checked }))
                }
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="changeReasonFeatures">Change Reason (for compliance audit trail)</Label>
            <Input
              id="changeReasonFeatures"
              placeholder="e.g., Enabled Daily Rounds for biomedical engineering staff"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
