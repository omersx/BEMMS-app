'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar as CalendarIcon, Building2, Search, Filter } from 'lucide-react';
import { TeamHeaderStats } from './team-header-stats';
import { EngineerCard } from './engineer-card';
import { ScheduleCalendar } from './schedule-calendar';
import { DepartmentCoverage } from './department-coverage';
import { EditEngineerDialog } from './edit-engineer-dialog';
import { EngineerTeamMember } from '@/lib/actions/engineers';
import { useRouter } from 'next/navigation';

interface TeamPageClientProps {
  initialMembers: EngineerTeamMember[];
  stats: {
    totalEngineers: number;
    onDutyToday: number;
    onCallToday: number;
    inMaintenanceToday: number;
    offDutyToday: number;
    totalActiveWorkOrders: number;
  };
  coverage: {
    id: string;
    name: string;
    code: string;
    deviceCount: number;
    primaryEngineer: any;
  }[];
}

export function TeamPageClient({ initialMembers, stats, coverage }: TeamPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerTeamMember | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredMembers = initialMembers.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      (m.specialization && m.specialization.toLowerCase().includes(search.toLowerCase())) ||
      (m.extension && m.extension.includes(search));

    const matchesStatus =
      statusFilter === 'all' ||
      m.dutyStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (engineer: EngineerTeamMember) => {
    setSelectedEngineer(engineer);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biomedical Engineering Team & Roster</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Clinical engineering staff directory, real-time hospital duty status, and department coverage roster.
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <TeamHeaderStats stats={stats} />

      {/* Main Tabs */}
      <Tabs defaultValue="directory" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto h-9">
            <TabsTrigger value="directory" className="text-xs gap-1.5 px-3">
              <Users className="w-3.5 h-3.5" />
              Team Directory
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs gap-1.5 px-3">
              <CalendarIcon className="w-3.5 h-3.5" />
              Duty Schedule
            </TabsTrigger>
            <TabsTrigger value="coverage" className="text-xs gap-1.5 px-3">
              <Building2 className="w-3.5 h-3.5" />
              Dept. Coverage
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Directory */}
        <TabsContent value="directory" className="space-y-4 m-0">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search engineer by name, title, specialization, or extension..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="text-xs h-8"
              >
                All ({initialMembers.length})
              </Button>
              <Button
                variant={statusFilter === 'on_duty' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('on_duty')}
                className="text-xs h-8 text-emerald-700 dark:text-emerald-400 gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                On Duty ({stats.onDutyToday})
              </Button>
              <Button
                variant={statusFilter === 'on_call' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('on_call')}
                className="text-xs h-8 text-amber-700 dark:text-amber-400 gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                On Call ({stats.onCallToday})
              </Button>
              <Button
                variant={statusFilter === 'off_duty' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('off_duty')}
                className="text-xs h-8 text-muted-foreground gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Off Duty ({stats.offDutyToday})
              </Button>
            </div>
          </div>

          {/* Engineers Cards Grid */}
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <EngineerCard key={member.id} engineer={member} onEdit={handleEdit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-xl space-y-2 bg-muted/10">
              <Users className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="font-semibold text-sm">No engineers match your filter</p>
              <p className="text-xs text-muted-foreground">Try clearing your search query or status filter.</p>
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                Reset Filters
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Duty Calendar */}
        <TabsContent value="schedule" className="space-y-4 m-0">
          <ScheduleCalendar engineers={initialMembers} />
        </TabsContent>

        {/* Tab 3: Department Coverage */}
        <TabsContent value="coverage" className="space-y-4 m-0">
          <DepartmentCoverage coverage={coverage} />
        </TabsContent>
      </Tabs>

      {/* Edit Engineer Dialog */}
      <EditEngineerDialog
        engineer={selectedEngineer}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
