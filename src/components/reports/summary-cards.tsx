import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SummaryItem {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  color?: string;
}

interface ReportSummaryCardsProps {
  items: SummaryItem[];
  className?: string;
}

export function ReportSummaryCards({ items, className }: ReportSummaryCardsProps) {
  return (
    <div className={cn('grid gap-3 grid-cols-2 lg:grid-cols-4', className)}>
      {items.map((item) => (
        <Card key={item.label} className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {item.label}
              </p>
              {item.icon && (
                <item.icon className={cn('h-4 w-4', item.color || 'text-muted-foreground')} />
              )}
            </div>
            <p className={cn('text-2xl font-bold mt-1', item.color)}>
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
