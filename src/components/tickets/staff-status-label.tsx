import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getStaffStatus, getStaffStatusStyle } from '@/lib/utils/staff-status';

interface StaffStatusLabelProps {
  statusCode: string;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

/**
 * Staff-facing ticket status badge.
 * Shows plain-language labels like "Being repaired" instead of "in_progress".
 * Used in staff dashboards, ticket lists, and ticket detail pages.
 */
export function StaffStatusLabel({ statusCode, showIcon = true, size = 'default' }: StaffStatusLabelProps) {
  const info = getStaffStatus(statusCode);
  const style = getStaffStatusStyle(statusCode);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium whitespace-nowrap',
        style.bg,
        style.text,
        style.border,
        size === 'sm' && 'text-xs px-1.5 py-0',
      )}
    >
      {showIcon && <span className="mr-1">{info.icon}</span>}
      {info.label}
    </Badge>
  );
}

/**
 * Larger staff status display with description.
 * Used on ticket detail pages for staff.
 */
export function StaffStatusBanner({ statusCode }: { statusCode: string }) {
  const info = getStaffStatus(statusCode);
  const style = getStaffStatusStyle(statusCode);

  return (
    <div className={cn('rounded-lg border px-4 py-3', style.bg, style.border)}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{info.icon}</span>
        <div>
          <p className={cn('font-semibold text-sm', style.text)}>{info.label}</p>
          {info.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
