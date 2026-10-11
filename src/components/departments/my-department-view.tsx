'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DeviceStatusBadge } from '@/components/devices/device-badges';
import { PageHeader } from '@/components/shared/page-header';
import {
  Search,
  Monitor,
  AlertTriangle,
  Wrench,
  CheckCircle,
  PlusCircle,
  TicketCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceItem {
  id: string;
  name: string;
  assetNumber: string;
  currentStatusCode: string;
  locationName: string;
  categoryName: string;
  manufacturerName: string;
  activeTickets: {
    id: string;
    ticketNumber: string;
    title: string;
    statusCode: string;
  }[];
}

interface MyDepartmentViewProps {
  department: {
    name: string;
    hospitalName: string;
  };
  devices: DeviceItem[];
  stats: {
    total: number;
    operational: number;
    underMaintenance: number;
    outOfService: number;
  };
}

type StatusFilter = 'all' | 'operational' | 'maintenance' | 'out_of_service';

export function MyDepartmentView({
  department,
  devices,
  stats,
}: MyDepartmentViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredDevices = useMemo(() => {
    let filtered = devices;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.assetNumber.toLowerCase().includes(q) ||
          d.locationName.toLowerCase().includes(q) ||
          d.categoryName.toLowerCase().includes(q) ||
          d.manufacturerName.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'operational') {
      filtered = filtered.filter(
        (d) => d.currentStatusCode === 'operational'
      );
    } else if (statusFilter === 'maintenance') {
      filtered = filtered.filter((d) =>
        [
          'under_repair',
          'under_maintenance',
          'waiting_for_parts',
          'under_investigation',
        ].includes(d.currentStatusCode)
      );
    } else if (statusFilter === 'out_of_service') {
      filtered = filtered.filter((d) =>
        ['out_of_service', 'decommissioned'].includes(d.currentStatusCode)
      );
    }

    // Sort: unavailable devices first
    return filtered.sort((a, b) => {
      const priority: Record<string, number> = {
        out_of_service: 0,
        decommissioned: 1,
        under_repair: 2,
        under_maintenance: 3,
        waiting_for_parts: 4,
        under_investigation: 5,
        operational: 6,
      };
      return (
        (priority[a.currentStatusCode] ?? 10) -
        (priority[b.currentStatusCode] ?? 10)
      );
    });
  }, [devices, search, statusFilter]);

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'operational', label: 'Available', count: stats.operational },
    {
      key: 'maintenance',
      label: 'Under Maint.',
      count: stats.underMaintenance,
    },
    {
      key: 'out_of_service',
      label: 'Out of Service',
      count: stats.outOfService,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="My Department"
        description={`${department.name} \u00B7 ${department.hospitalName}`}
      >
        <Link href="/tickets/create">
          <Button size="lg" className="min-h-[44px]">
            <PlusCircle className="mr-2 h-5 w-5" />
            Report Problem
          </Button>
        </Link>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Devices</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats.operational}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Available
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {stats.underMaintenance}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Maintenance
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {stats.outOfService}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">
              Out of Service
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search devices by name, asset number, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors whitespace-nowrap',
              statusFilter === f.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Device List */}
      {filteredDevices.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Monitor className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {search
              ? 'No devices match your search.'
              : 'No devices in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevices.map((device) => (
            <StaffDeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

function StaffDeviceCard({ device }: { device: DeviceItem }) {
  const isOOS = ['out_of_service', 'decommissioned'].includes(
    device.currentStatusCode
  );
  const isMaint = [
    'under_repair',
    'under_maintenance',
    'waiting_for_parts',
    'under_investigation',
  ].includes(device.currentStatusCode);
  const hasActiveTicket = device.activeTickets.length > 0;

  return (
    <Card
      className={cn(
        'shadow-sm overflow-hidden',
        isOOS && 'border-red-200 dark:border-red-900',
        isMaint && 'border-amber-200 dark:border-amber-900'
      )}
    >
      {/* Status Banner for non-operational devices */}
      {isOOS && (
        <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5 border-b border-red-200 dark:border-red-900">
          <AlertTriangle className="w-3.5 h-3.5" />
          OUT OF SERVICE — Do not use
        </div>
      )}
      {isMaint && (
        <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 border-b border-amber-200 dark:border-amber-900">
          <Wrench className="w-3.5 h-3.5" />
          UNDER MAINTENANCE
        </div>
      )}

      <CardContent className="p-4">
        {/* Device Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate">{device.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {device.assetNumber}
              {device.locationName && ` · ${device.locationName}`}
            </p>
            {device.manufacturerName && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {device.manufacturerName}
                {device.categoryName && ` · ${device.categoryName}`}
              </p>
            )}
          </div>
          <DeviceStatusBadge status={device.currentStatusCode} />
        </div>

        {/* Active Ticket Alert */}
        {hasActiveTicket && (
          <div className="mt-3 space-y-1.5">
            {device.activeTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 rounded-lg px-2.5 py-1.5 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
              >
                <TicketCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  <strong>{ticket.ticketNumber}</strong> — {ticket.title}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {hasActiveTicket ? (
            <Button asChild variant="outline" size="sm" className="min-h-[36px]">
              <Link href={`/tickets/${device.activeTickets[0].id}`}>
                <TicketCheck className="mr-1.5 h-3.5 w-3.5" />
                View Ticket
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="min-h-[36px]">
              <Link href={`/tickets/create?deviceId=${device.id}`}>
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Report Problem
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="min-h-[36px]">
            <Link href={`/devices/${device.id}`}>
              <Monitor className="mr-1.5 h-3.5 w-3.5" />
              View Device
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
