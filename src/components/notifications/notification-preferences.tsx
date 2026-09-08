'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, TicketCheck, Wrench, Monitor, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/actions/notifications';

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState({
    pushEnabled: true,
    categories: {
      tickets: true,
      maintenance: true,
      devices: true,
      system: true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');

  useEffect(() => {
    setPushSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    getNotificationPreferences().then((p) => {
      if (p) setPrefs(p);
    });
  }, []);

  const handleTogglePush = async (enabled: boolean) => {
    if (enabled && pushPermission !== 'granted') {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }

      // Subscribe to push
      try {
        const reg = await navigator.serviceWorker.ready;
        const res = await fetch('/api/notifications/vapid-key');
        const { publicKey } = await res.json();

        if (publicKey) {
          const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey,
          });

          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription.toJSON()),
          });
        }
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    }

    const updated = { ...prefs, pushEnabled: enabled };
    setPrefs(updated);
    await savePrefs(updated);
  };

  const handleToggleCategory = async (category: keyof typeof prefs.categories, enabled: boolean) => {
    const updated = {
      ...prefs,
      categories: { ...prefs.categories, [category]: enabled },
    };
    setPrefs(updated);
    await savePrefs(updated);
  };

  const savePrefs = async (p: typeof prefs) => {
    setSaving(true);
    try {
      await updateNotificationPreferences(p);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    if (pushPermission !== 'granted') {
      toast.error('Enable push notifications first');
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('BEMMS Test', {
      body: 'Push notifications are working!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
    toast.success('Test notification sent!');
  };

  const categories = [
    { key: 'tickets' as const, label: 'Tickets', desc: 'Assignments, status changes, comments', icon: TicketCheck },
    { key: 'maintenance' as const, label: 'Maintenance', desc: 'PM reminders, task reviews, approvals', icon: Wrench },
    { key: 'devices' as const, label: 'Devices', desc: 'Status changes, availability alerts', icon: Monitor },
    { key: 'system' as const, label: 'System', desc: 'SLA warnings, system alerts', icon: Settings },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Master Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label className="text-sm font-medium">Push Notifications</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {!pushSupported
                ? 'Not supported in this browser'
                : pushPermission === 'denied'
                ? 'Blocked — enable in browser settings'
                : 'Receive native notifications on this device'}
            </p>
          </div>
          <Switch
            checked={prefs.pushEnabled}
            onCheckedChange={handleTogglePush}
            disabled={!pushSupported || pushPermission === 'denied'}
          />
        </div>

        {/* Category Toggles */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Categories</h4>
          {categories.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <cat.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">{cat.label}</Label>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </div>
              </div>
              <Switch
                checked={prefs.categories[cat.key]}
                onCheckedChange={(v: boolean) => handleToggleCategory(cat.key, v)}
              />
            </div>
          ))}
        </div>

        {/* Test Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={sendTestNotification}
          className="w-full min-h-[44px]"
          disabled={!prefs.pushEnabled || pushPermission !== 'granted'}
        >
          Send Test Notification
        </Button>
      </CardContent>
    </Card>
  );
}
