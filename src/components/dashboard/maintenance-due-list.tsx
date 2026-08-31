'use client';

import Link from "next/link";
import { formatDistanceToNow, isPast, isToday } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaintenanceTaskItem {
  id: string;
  taskNumber: string;
  title: string;
  statusCode: string;
  dueDate: Date | null;
  deviceName?: string | null;
  maintenanceType: string;
}

interface MaintenanceDueListProps {
  tasks: MaintenanceTaskItem[];
  title: string;
}

export function MaintenanceDueList({ tasks, title }: MaintenanceDueListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Wrench className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center border rounded-md bg-muted/20">
            No maintenance tasks due.
          </p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              let dueLabel = "Scheduled";
              let dueColor = "bg-blue-100 text-blue-800 border-blue-200";

              if (task.dueDate) {
                const date = new Date(task.dueDate);
                if (isPast(date) && !isToday(date)) {
                  dueLabel = "Overdue";
                  dueColor = "bg-red-100 text-red-800 border-red-200 font-medium";
                } else if (isToday(date)) {
                  dueLabel = "Due Today";
                  dueColor = "bg-orange-100 text-orange-800 border-orange-200 font-medium";
                } else {
                  dueLabel = "Due Soon";
                  dueColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
                }
              }

              return (
                <Link key={task.id} href={`/maintenance/tasks/${task.id}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2 min-h-[44px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">{task.taskNumber}</span>
                        <Badge variant="outline" className={cn("text-xs font-normal", dueColor)}>
                          {dueLabel}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium line-clamp-1">{task.title}</span>
                      {task.deviceName && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{task.deviceName}</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <div className="text-xs text-muted-foreground whitespace-nowrap self-start sm:self-auto">
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
