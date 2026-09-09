import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  href: string;
  color?: string;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon, href, trend, className }: StatCardProps) {
  return (
    <Link href={href} className="block min-h-[44px]">
      <Card className={cn("hover:bg-muted/50 transition-colors cursor-pointer h-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {icon}
          </div>
          <div className="flex flex-col mt-4">
            <div className="text-3xl font-bold">{value}</div>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">
                {trend}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
