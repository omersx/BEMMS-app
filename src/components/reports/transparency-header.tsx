import { Calendar, Filter, Globe } from 'lucide-react';

interface TransparencyHeaderProps {
  reportType: string;
  dateRange?: { start?: string; end?: string };
  timezone: string;
  filters?: Record<string, string>;
  generatedAt?: Date;
}

export function ReportTransparencyHeader({
  reportType,
  dateRange,
  timezone,
  filters,
  generatedAt,
}: TransparencyHeaderProps) {
  const dateStr = dateRange?.start && dateRange?.end
    ? `${new Date(dateRange.start).toLocaleDateString()} – ${new Date(dateRange.end).toLocaleDateString()}`
    : 'All time';

  const activeFilters = filters
    ? Object.entries(filters)
        .filter(([, v]) => v && v !== 'all')
        .map(([k, v]) => `${k}: ${v}`)
    : [];

  return (
    <div className="bg-muted/30 border rounded-lg px-4 py-3 text-sm space-y-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {dateStr}
        </span>
        <span className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          {timezone}
        </span>
        {activeFilters.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            {activeFilters.join(' · ')}
          </span>
        )}
      </div>
      {generatedAt && (
        <p className="text-xs text-muted-foreground">
          Generated: {generatedAt.toLocaleString()}
        </p>
      )}
    </div>
  );
}
