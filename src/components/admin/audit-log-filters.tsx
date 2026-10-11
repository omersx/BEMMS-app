'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export interface AuditLogFiltersProps {
  entityTypes: string[];
  actors: { id: string; fullName: string; email: string }[];
  actionTypes?: string[];
}

const DEFAULT_ACTION_TYPES = [
  'CREATE',
  'UPDATE',
  'DEACTIVATE',
  'ARCHIVE',
  'TRANSFER',
  'PURGE',
  'SIGN',
  'POLICY_CHANGE',
  'LOGIN',
  'LOGOUT',
  'FAILED_LOGIN',
];

/**
 * Filter controls for the Audit Log management dashboard.
 * Interacts with URL search params to drive server-side filtering.
 */
export function AuditLogFilters({
  entityTypes,
  actors,
  actionTypes = DEFAULT_ACTION_TYPES,
}: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') || '';
  const currentEntityType = searchParams.get('entityType') || 'all';
  const currentActionType = searchParams.get('actionType') || 'all';
  const currentActorId = searchParams.get('actorId') || 'all';
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync internal search state when search param changes externally
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 whenever filters change
      params.delete('page');

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  // Debounced search input handler (300ms)
  useEffect(() => {
    if (searchInput === currentSearch) return;

    const timer = setTimeout(() => {
      updateParam('search', searchInput.trim() || null);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, currentSearch, updateParam]);

  const handleClearFilters = () => {
    setSearchInput('');
    startTransition(() => {
      router.push(window.location.pathname);
    });
  };

  const activeFilterCount = [
    currentSearch,
    currentEntityType !== 'all' ? currentEntityType : '',
    currentActionType !== 'all' ? currentActionType : '',
    currentActorId !== 'all' ? currentActorId : '',
    currentStartDate,
    currentEndDate,
  ].filter(Boolean).length;

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header / Filter Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter Audit Records</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
                {activeFilterCount} active
              </Badge>
            )}
            {isPending && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Updating...
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Text Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search entity, reason, IP..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 pr-8 h-9 text-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateParam('search', null);
                }}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Type Dropdown */}
          <div>
            <Select
              value={currentActionType}
              onValueChange={(val) => updateParam('actionType', val)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Type Dropdown */}
          <div>
            <Select
              value={currentEntityType}
              onValueChange={(val) => updateParam('entityType', val)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actor Dropdown */}
          <div>
            <Select
              value={currentActorId}
              onValueChange={(val) => updateParam('actorId', val)}
            >
              <SelectTrigger className="h-9 text-sm truncate">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Actors</SelectItem>
                {actors.map((actor) => (
                  <SelectItem key={actor.id} value={actor.id}>
                    {actor.fullName || actor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 sm:col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex-1">
              <Input
                type="date"
                value={currentStartDate}
                onChange={(e) => updateParam('startDate', e.target.value || null)}
                className="h-9 text-xs px-2"
                title="Start Date"
              />
            </div>
            <span className="text-xs text-muted-foreground">to</span>
            <div className="flex-1">
              <Input
                type="date"
                value={currentEndDate}
                onChange={(e) => updateParam('endDate', e.target.value || null)}
                className="h-9 text-xs px-2"
                title="End Date"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
