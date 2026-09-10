import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/auth/rbac';
import { getOrganizationSettings, getSystemHealth } from '@/lib/actions/system-settings';
import { SystemSettingsTabs } from '@/components/admin/system-settings-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default async function SystemSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Authorize only SYS_ADMIN and ORG_ADMIN
  try {
    await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  } catch {
    redirect('/dashboard');
  }

  const [settingsRes, healthRes] = await Promise.all([
    getOrganizationSettings(),
    getSystemHealth(),
  ]);

  if (!settingsRes.success) {
    return (
      <div className="p-6">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to Load System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {settingsRes.error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fallbackHealth = {
    status: 'healthy' as const,
    databaseStatus: 'connected' as const,
    databasePingMs: 0,
    environment: 'development',
    uptimeSeconds: 0,
    serverTime: new Date().toISOString(),
    memoryUsage: { rssMb: 0, heapUsedMb: 0, heapTotalMb: 0 },
    runtime: { nodeVersion: 'v20', platform: 'win32', arch: 'x64' },
  };

  return (
    <div className="space-y-6">
      <SystemSettingsTabs
        settings={settingsRes.data}
        organizationId={settingsRes.organizationId}
        organizationName={settingsRes.organizationName}
        healthData={healthRes.data || fallbackHealth}
      />
    </div>
  );
}
