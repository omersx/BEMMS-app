'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FilterOption {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface ReportFilterChipsProps {
  filters: FilterOption[];
  onClear: () => void;
}

export function ReportFilterChips({ filters, onClear }: ReportFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="shrink-0 gap-1 cursor-pointer hover:bg-destructive/10 min-h-[32px] px-3"
          onClick={filter.onRemove}
        >
          <span className="text-xs text-muted-foreground">{filter.label}:</span>
          <span className="text-xs font-medium">{filter.value}</span>
          <span className="text-muted-foreground ml-1">×</span>
        </Badge>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0 underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
