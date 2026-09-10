'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Clock, Calendar, Languages, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateOrganizationSettings } from '@/lib/actions/system-settings';
import type { LocalizationSettings } from '@/lib/validators/system-settings';

interface LocalizationFormProps {
  initialData: LocalizationSettings;
  organizationId: string;
}

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (UTC+2 / UTC+3)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0 / UTC+1)' },
  { value: 'America/New_York', label: 'America/New_York (UTC-5 / UTC-4)' },
];

export function LocalizationForm({ initialData, organizationId }: LocalizationFormProps) {
  const [formData, setFormData] = useState<LocalizationSettings>(initialData);
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await updateOrganizationSettings({
        organizationId,
        section: 'localization',
        settings: formData,
        changeReason: changeReason.trim() || 'Updated localization and regional settings',
      });

      if (res.success) {
        toast.success('Localization settings saved successfully');
        setChangeReason('');
      } else {
        toast.error(res.error || 'Failed to update localization settings');
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
            <Globe className="h-5 w-5 text-primary" />
            Localization & Regional Preferences
          </CardTitle>
          <CardDescription>
            Configure time display, calendar formats, and operational language for this facility.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Default Facility Timezone
              </Label>
              <Select
                value={formData.timezone}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, timezone: val }))}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All maintenance schedules, PM occurrences, and audit events will display in this timezone.
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                Default Language
              </Label>
              <Select
                value={formData.language}
                onValueChange={(val: 'en' | 'ar') => setFormData((prev) => ({ ...prev, language: val }))}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US / UK)</SelectItem>
                  <SelectItem value="ar">العربية (Arabic - Future Support)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Application interface language preference (Section 14.1).
              </p>
            </div>

            {/* Date Format */}
            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date Format
              </Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(val: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY') =>
                  setFormData((prev) => ({ ...prev, dateFormat: val }))
                }
              >
                <SelectTrigger id="dateFormat">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 - Recommended)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK / EU)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Format */}
            <div className="space-y-2">
              <Label htmlFor="timeFormat" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Time Display
              </Label>
              <Select
                value={formData.timeFormat}
                onValueChange={(val: '24h' | '12h') => setFormData((prev) => ({ ...prev, timeFormat: val }))}
              >
                <SelectTrigger id="timeFormat">
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24-hour (14:30) - Clinical Standard</SelectItem>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audit Trace Reason */}
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="changeReason" className="text-sm font-medium">
              Change Reason (21 CFR Part 11 Audit Trace)
            </Label>
            <Input
              id="changeReason"
              placeholder="e.g., Hospital shifted default timezone to local regional time"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="max-w-xl"
            />
            <p className="text-xs text-muted-foreground">
              Optional documentation justification recorded in the immutable audit log.
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
                Save Localization
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
