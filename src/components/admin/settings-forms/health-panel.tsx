'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, Server, Cpu, Clock, RefreshCw, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSystemHealth, type SystemHealthData } from '@/lib/actions/system-settings';
import { toast } from 'sonner';

interface HealthPanelProps {
  initialData: SystemHealthData;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export function HealthPanel({ initialData }: HealthPanelProps) {
  const [health, setHealth] = useState<SystemHealthData>(initialData);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await getSystemHealth();
      if (res.success && res.data) {
        setHealth(res.data);
        toast.success('Telemetry updated');
      } else {
        toast.error(res.error || 'Failed to refresh health status');
      }
    } catch {
      toast.error('An error occurred while fetching health data');
    } finally {
      setRefreshing(false);
    }
  };

  const isHealthy = health.status === 'healthy';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5 text-primary" />
              Operational Telemetry & System Health
            </CardTitle>
            <CardDescription>
              Safe, read-only status of database connections, runtime environment, and background health.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Header Banner */}
          <div
            className={`p-4 rounded-lg flex items-center justify-between border ${
              isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {isHealthy ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
              )}
              <div>
                <h4 className="font-semibold text-base">
                  {isHealthy ? 'All Systems Operational' : 'System Degraded'}
                </h4>
                <p className="text-xs opacity-90">
                  {isHealthy
                    ? 'PostgreSQL database connected and query latency within acceptable limits.'
                    : 'System is experiencing elevated latency or service degradation.'}
                </p>
              </div>
            </div>
            <Badge variant={isHealthy ? 'default' : 'destructive'} className="uppercase">
              {health.status}
            </Badge>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Metric */}
            <div className="p-4 border rounded-lg bg-card space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Database Latency</span>
                <Database className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">
                {health.databasePingMs >= 0 ? `${health.databasePingMs}ms` : 'Error'}
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                PostgreSQL 16 Connected
              </span>
            </div>

            {/* Uptime Metric */}
            <div className="p-4 border rounded-lg bg-card space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Application Uptime</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">{formatUptime(health.uptimeSeconds)}</div>
              <span className="text-xs text-muted-foreground">
                Environment: <span className="font-medium text-foreground">{health.environment}</span>
              </span>
            </div>

            {/* Memory Metric */}
            <div className="p-4 border rounded-lg bg-card space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Memory (RSS / Heap)</span>
                <Cpu className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">{health.memoryUsage.rssMb} MB</div>
              <span className="text-xs text-muted-foreground">
                Heap Used: {health.memoryUsage.heapUsedMb} MB / {health.memoryUsage.heapTotalMb} MB
              </span>
            </div>

            {/* Runtime Metric */}
            <div className="p-4 border rounded-lg bg-card space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Platform & Node</span>
                <Server className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">{health.runtime.nodeVersion}</div>
              <span className="text-xs text-muted-foreground">
                OS: {health.runtime.platform} ({health.runtime.arch})
              </span>
            </div>
          </div>

          {/* Section 14.2 Compliance Notice */}
          <div className="p-4 border rounded-lg bg-muted/40 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                BEMMS Specification Section 14.2 Compliance Safeguard:
              </p>
              <p>
                PostgreSQL credentials, application encryption keys, signing PIN secrets, and TLS certificates
                are strictly isolated in protected server configuration (.env / Docker secrets). They are never
                accessible or returned to application web sessions to prevent credential leakage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
