'use client';

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  href: string;
  color?: string;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, href, color, trend, className }: StatCardProps) {
  return (
    <Link href={href} className="block min-h-[44px]">
      <Card className={cn("hover:bg-muted/50 transition-colors cursor-pointer h-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <Icon className={cn("h-4 w-4", color)} />
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
