import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldAlert, Users, Building, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminAlertsData {
  usersWithoutRoles: number;
  pendingInvitations: number;
  departmentsWithoutManager: number;
}

interface AdminAlertsProps {
  alerts: AdminAlertsData;
}

export function AdminAlerts({ alerts }: AdminAlertsProps) {
  const hasAlerts = alerts.usersWithoutRoles > 0 || alerts.pendingInvitations > 0 || alerts.departmentsWithoutManager > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3 bg-red-50/50 rounded-t-xl border-b border-red-100">
        <CardTitle className="text-lg flex items-center text-red-800">
          <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
          System Administration Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {alerts.usersWithoutRoles > 0 && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-card min-h-[44px]">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-950 p-2 rounded-full">
                <Users className="w-4 h-4 text-red-700 dark:text-red-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-red-900 dark:text-red-300">{alerts.usersWithoutRoles} Users Without Roles</span>
                <span className="text-xs text-red-700/80 dark:text-red-400/80">Users cannot access the system until roles are assigned.</span>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950">
              <Link href="/admin/users?filter=no-role">Fix</Link>
            </Button>
          </div>
        )}

        {alerts.pendingInvitations > 0 && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-card min-h-[44px]">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-950 p-2 rounded-full">
                <UserPlus className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-yellow-900 dark:text-yellow-300">{alerts.pendingInvitations} Pending Invitations</span>
                <span className="text-xs text-yellow-700/80 dark:text-yellow-400/80">Users have not yet accepted their invitations.</span>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-950">
              <Link href="/admin/users?status=invited">Review</Link>
            </Button>
          </div>
        )}

        {alerts.departmentsWithoutManager > 0 && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-card min-h-[44px]">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-950 p-2 rounded-full">
                <Building className="w-4 h-4 text-orange-700 dark:text-orange-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-orange-900 dark:text-orange-300">{alerts.departmentsWithoutManager} Departments Missing Manager</span>
                <span className="text-xs text-orange-700/80 dark:text-orange-400/80">Some departments lack an assigned manager.</span>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950">
              <Link href="/admin/departments?filter=no-manager">Manage</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

