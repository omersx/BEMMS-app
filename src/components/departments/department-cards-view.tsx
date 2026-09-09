'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building,
  Building2,
  Search,
  Monitor,
  AlertTriangle,
  Ticket,
  ChevronRight,
  HeartPulse,
  Activity,
  Microscope,
  Stethoscope,
  Radio,
  Eye,
  Cross,
} from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  code: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  departmentType?: string | null;
  status?: string | null;
  hospital?: {
    id: string;
    name: string;
    code: string;
  } | null;
  manager?: {
    id: string;
    fullName?: string | null;
    email?: string | null;
  } | null;
  stats: {
    totalDevices: number;
    operationalDevices: number;
    outOfServiceDevices: number;
    activeTickets: number;
    operationalRate: number;
  };
}

interface DepartmentCardsViewProps {
  departments: Department[];
  hospitals: Hospital[];
}

function getDepartmentIcon(name: string, type?: string | null) {
  const lower = (name + ' ' + (type || '')).toLowerCase();
  if (lower.includes('cardio') || lower.includes('heart')) return HeartPulse;
  if (lower.includes('icu') || lower.includes('intensive') || lower.includes('critical')) return Activity;
  if (lower.includes('lab') || lower.includes('pathology')) return Microscope;
  if (lower.includes('radio') || lower.includes('x-ray') || lower.includes('imaging') || lower.includes('mri')) return Radio;
  if (lower.includes('eye') || lower.includes('ophthal')) return Eye;
  if (lower.includes('emerg') || lower.includes('trauma') || lower.includes('er')) return Cross;
  if (lower.includes('surg') || lower.includes('op') || lower.includes('theater')) return Stethoscope;
  return Building;
}

export function DepartmentCardsView({ departments, hospitals }: DepartmentCardsViewProps) {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      // Hospital filter
      if (selectedHospitalId !== 'all' && dept.hospital?.id !== selectedHospitalId) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = dept.name.toLowerCase().includes(q);
        const matchesCode = dept.code.toLowerCase().includes(q);
        const matchesHospital = dept.hospital?.name.toLowerCase().includes(q) || false;
        const matchesManager = dept.manager?.fullName?.toLowerCase().includes(q) || false;
        const matchesType = dept.departmentType?.toLowerCase().includes(q) || false;
        return matchesName || matchesCode || matchesHospital || matchesManager || matchesType;
      }
      return true;
    });
  }, [departments, selectedHospitalId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Controls: Search & Hospital selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments, codes, managers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {/* Hospital selector chips if more than 1 hospital */}
        {hospitals.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedHospitalId('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                selectedHospitalId === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Hospitals ({departments.length})
            </button>
            {hospitals.map((h) => {
              const count = departments.filter((d) => d.hospital?.id === h.id).length;
              const isSelected = selectedHospitalId === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHospitalId(h.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {h.name} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Department Cards Grid */}
      {filteredDepartments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-base font-medium">No departments found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search query or hospital filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => {
            const Icon = getDepartmentIcon(dept.name, dept.departmentType);
            const { stats } = dept;
            const hasIssues = stats.outOfServiceDevices > 0 || stats.activeTickets > 0;

            return (
              <Link
                key={dept.id}
                href={`/departments/${dept.id}`}
                className="group block focus:outline-none"
              >
                <Card className="h-full border transition-all duration-200 hover:shadow-md hover:border-primary/40 group-active:scale-[0.99] cursor-pointer flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4">
                    {/* Header: Icon, Name, Code */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors truncate">
                            {dept.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono">{dept.code}</span>
                            {dept.hospital && (
                              <>
                                <span>•</span>
                                <span className="truncate">{dept.hospital.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Operational Health Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Operational Health</span>
                        <span className={`font-semibold ${
                          stats.operationalRate >= 90
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : stats.operationalRate >= 75
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {stats.operationalRate}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            stats.operationalRate >= 90
                              ? 'bg-emerald-500'
                              : stats.operationalRate >= 75
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(stats.operationalRate, 5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Badge variant="secondary" className="text-xs font-normal gap-1">
                        <Monitor className="w-3.5 h-3.5 text-blue-500" />
                        <span>{stats.totalDevices} {stats.totalDevices === 1 ? 'Device' : 'Devices'}</span>
                      </Badge>

                      {stats.outOfServiceDevices > 0 && (
                        <Badge variant="outline" className="text-xs font-normal border-red-200 text-red-600 bg-red-50 dark:bg-red-950/50 gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span>{stats.outOfServiceDevices} Down</span>
                        </Badge>
                      )}

                      {stats.activeTickets > 0 && (
                        <Badge variant="outline" className="text-xs font-normal border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-950/50 gap-1">
                          <Ticket className="w-3.5 h-3.5 text-amber-500" />
                          <span>{stats.activeTickets} {stats.activeTickets === 1 ? 'Ticket' : 'Tickets'}</span>
                        </Badge>
                      )}

                      {!hasIssues && stats.totalDevices > 0 && (
                        <Badge variant="outline" className="text-xs font-normal border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
                          All Operational
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
