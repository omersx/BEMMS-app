'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeviceStatusBadge, CriticalityBadge } from '@/components/devices/device-badges';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/tickets/ticket-badges';
import {
  Monitor,
  Ticket,
  MapPin,
  Search,
  Plus,
  QrCode,
  Edit,
  ArrowLeft,
  ChevronRight,
  User,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDepartmentVisuals } from './department-visuals';

interface DepartmentDetailViewProps {
  department: {
    id: string;
    name: string;
    code: string;
    departmentType?: string | null;
    status?: string | null;
    hospitalName?: string | null;
    managerName?: string | null;
    organizationId?: string;
  };
  devices: any[];
  tickets: any[];
  locations: any[];
  stats: {
    totalDevices: number;
    operationalDevices: number;
    outOfServiceDevices: number;
    activeTicketsCount: number;
    operationalRate: number;
  };
  isAdmin: boolean;
}

export function DepartmentDetailView({
  department,
  devices,
  tickets,
  locations,
  stats,
  isAdmin,
}: DepartmentDetailViewProps) {
  const visual = getDepartmentVisuals(department.name, department.code, department.departmentType);
  const DeptIcon = visual.icon;

  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState<string>('all');
  const [ticketSearch, setTicketSearch] = useState('');

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      // Status filter
      if (deviceStatusFilter !== 'all') {
        if (deviceStatusFilter === 'operational' && device.currentStatusCode !== 'operational') {
          return false;
        }
        if (
          deviceStatusFilter === 'issues' &&
          !['out_of_service', 'under_repair', 'under_maintenance'].includes(device.currentStatusCode)
        ) {
          return false;
        }
      }

      // Text search
      if (deviceSearch.trim()) {
        const q = deviceSearch.toLowerCase().trim();
        const matchesName = device.name?.toLowerCase().includes(q) || false;
        const matchesAsset = device.assetNumber?.toLowerCase().includes(q) || false;
        const matchesCode = device.internalCode?.toLowerCase().includes(q) || false;
        const matchesCategory = device.deviceCategory?.name?.toLowerCase().includes(q) || false;
        const matchesModel = device.deviceModel?.modelName?.toLowerCase().includes(q) || false;
        const matchesLocation = device.location?.name?.toLowerCase().includes(q) || false;
        return matchesName || matchesAsset || matchesCode || matchesCategory || matchesModel || matchesLocation;
      }

      return true;
    });
  }, [devices, deviceSearch, deviceStatusFilter]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (!ticketSearch.trim()) return true;
      const q = ticketSearch.toLowerCase().trim();
      const matchesNum = ticket.ticketNumber?.toLowerCase().includes(q) || false;
      const matchesTitle = ticket.title?.toLowerCase().includes(q) || false;
      const matchesDevice = ticket.device?.name?.toLowerCase().includes(q) || false;
      return matchesNum || matchesTitle || matchesDevice;
    });
  }, [tickets, ticketSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/departments"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors min-h-[36px] py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Departments</span>
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{department.name}</span>
      </div>

      {/* Department Summary Header Card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={cn("p-3 rounded-2xl shrink-0 mt-0.5", visual.detailWrapperClass)}>
                <DeptIcon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{department.name}</h1>
                  <Badge variant="outline" className="font-mono text-xs">
                    {department.code}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs font-medium", visual.badgeClass)}>
                    {department.departmentType || visual.badgeLabel}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-muted-foreground">
                  {department.hospitalName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {department.hospitalName}
                    </span>
                  )}
                  {department.managerName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Manager: {department.managerName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
              <Button asChild size="sm" variant="outline" className="min-h-[40px] flex-1 sm:flex-none">
                <Link href="/scan">
                  <QrCode className="w-4 h-4 mr-1.5" />
                  Scan QR
                </Link>
              </Button>
              <Button asChild size="sm" className="min-h-[40px] flex-1 sm:flex-none">
                <Link href="/tickets/create">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Report Issue
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild size="sm" variant="ghost" className="min-h-[40px]">
                  <Link href={`/admin/departments/${department.id}/edit`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Operational Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
            <div className="p-3 bg-muted/40 rounded-xl border">
              <div className="text-xs text-muted-foreground">Total Equipment</div>
              <div className="text-2xl font-bold mt-1 text-primary">{stats.totalDevices}</div>
            </div>
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="text-xs text-emerald-700 dark:text-emerald-400">Operational</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {stats.operationalDevices}
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${
              stats.outOfServiceDevices > 0
                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
                : 'bg-muted/40'
            }`}>
              <div className={`text-xs ${stats.outOfServiceDevices > 0 ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'}`}>
                Down / Repair
              </div>
              <div className={`text-2xl font-bold mt-1 ${stats.outOfServiceDevices > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                {stats.outOfServiceDevices}
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${
              stats.activeTicketsCount > 0
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
                : 'bg-muted/40'
            }`}>
              <div className={`text-xs ${stats.activeTicketsCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>
                Active Tickets
              </div>
              <div className={`text-2xl font-bold mt-1 ${stats.activeTicketsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                {stats.activeTicketsCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segmented Tabs: Devices | Tickets | Locations */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md h-11 p-1 bg-muted/70">
          <TabsTrigger value="devices" className="text-xs sm:text-sm gap-1.5">
            <Monitor className="w-4 h-4" />
            <span>Devices</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-medium">
              {devices.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs sm:text-sm gap-1.5">
            <Ticket className="w-4 h-4" />
            <span>Tickets</span>
            {tickets.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-medium">
                {tickets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="locations" className="text-xs sm:text-sm gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>Rooms</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-medium">
              {locations.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Devices ── */}
        <TabsContent value="devices" className="space-y-4 focus:outline-none">
          {/* Controls: Search & Status filter chips */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search department devices by name, asset #, category..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setDeviceStatusFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                  deviceStatusFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All ({devices.length})
              </button>
              <button
                onClick={() => setDeviceStatusFilter('operational')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                  deviceStatusFilter === 'operational'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Operational ({stats.operationalDevices})
              </button>
              <button
                onClick={() => setDeviceStatusFilter('issues')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                  deviceStatusFilter === 'issues'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Down / Repair ({stats.outOfServiceDevices})
              </button>
            </div>
          </div>

          {/* Devices List */}
          {filteredDevices.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-3">
                <Monitor className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <p className="text-base font-medium">No equipment found</p>
                <p className="text-sm text-muted-foreground">
                  No devices match your search or filter in this department.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDevices.map((device) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.id}`}
                  className="group block focus:outline-none"
                >
                  <Card className="h-full border transition-all duration-200 hover:shadow-md hover:border-primary/40 group-active:scale-[0.99] cursor-pointer">
                    <CardContent className="p-4 space-y-3">
                      {/* Top row: Code + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-primary group-hover:underline">
                          {device.internalCode || device.assetNumber}
                        </span>
                        <DeviceStatusBadge status={device.currentStatusCode} />
                      </div>

                      {/* Device Name & Details */}
                      <div>
                        <h4 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                          {device.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {device.manufacturer?.name || 'Unknown Mfg'} {device.modelNumber ? `• ${device.modelNumber}` : ''}
                        </p>
                      </div>

                      {/* Bottom row: Asset Tag + Location + Criticality */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t text-muted-foreground">
                        <span className="truncate">
                          {device.location?.name || 'Main Dept Area'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {device.criticalityLevel && (
                            <CriticalityBadge level={device.criticalityLevel} />
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: Active Tickets ── */}
        <TabsContent value="tickets" className="space-y-4 focus:outline-none">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets by number, title, device..."
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          {filteredTickets.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-3">
                <Ticket className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <p className="text-base font-medium">No active tickets</p>
                <p className="text-sm text-muted-foreground">
                  All equipment in this department is free of open service tickets.
                </p>
                <Button asChild size="sm" className="mt-2">
                  <Link href="/tickets/create">Report an Issue</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block group focus:outline-none"
                >
                  <Card className="border hover:shadow-sm hover:border-primary/40 transition-all p-4 group-active:scale-[0.99]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {ticket.ticketNumber}
                          </span>
                          <TicketPriorityBadge priority={ticket.priorityCode} />
                          <TicketStatusBadge status={ticket.statusCode} />
                        </div>
                        <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                          {ticket.title}
                        </h4>
                        {ticket.device && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {ticket.device.name} ({ticket.device.assetNumber})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(ticket.reportedAt).toLocaleDateString()}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 3: Locations / Rooms ── */}
        <TabsContent value="locations" className="space-y-4 focus:outline-none">
          {locations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-3">
                <MapPin className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <p className="text-base font-medium">No specific rooms configured</p>
                <p className="text-sm text-muted-foreground">
                  All devices in this department are currently registered under the main department floor.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((loc) => {
                const roomDevices = devices.filter((d) => d.locationId === loc.id);
                return (
                  <Card key={loc.id} className="border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary" />
                          <h4 className="font-semibold text-sm">{loc.name}</h4>
                        </div>
                        {loc.code && <p className="font-mono text-xs text-muted-foreground">{loc.code}</p>}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {roomDevices.length} {roomDevices.length === 1 ? 'Device' : 'Devices'}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
