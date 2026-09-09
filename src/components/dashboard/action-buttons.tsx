import Link from "next/link";
import { QrCode, PlusCircle, Inbox, Users, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActionButtonsProps {
  role: string;
  triageCount?: number;
}

export function ActionButtons({ role, triageCount = 0 }: ActionButtonsProps) {
  const normalizedRole = (role || '').toUpperCase();
  const isStaff = normalizedRole === 'STAFF' || normalizedRole === 'DEPT_MGR';
  const isBiomed = normalizedRole.startsWith('BIOMED') || normalizedRole === 'BME';
  const isAdmin = normalizedRole.includes('ADMIN');

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button asChild size="lg" className="w-full sm:w-auto min-h-[44px]">
        <Link href="/devices/scan">
          <QrCode className="mr-2 h-5 w-5" />
          Scan Device
        </Link>
      </Button>

      {isStaff && (
        <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto min-h-[44px]">
          <Link href="/tickets/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Report a Problem
          </Link>
        </Button>
      )}

      {isBiomed && (
        <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto min-h-[44px] relative">
          <Link href="/tickets/triage">
            <Inbox className="mr-2 h-5 w-5" />
            Triage Queue
            {triageCount > 0 && (
              <Badge variant="destructive" className="ml-2 absolute -top-2 -right-2">
                {triageCount}
              </Badge>
            )}
          </Link>
        </Button>
      )}

      {isAdmin && (
        <>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-h-[44px]">
            <Link href="/admin/users">
              <Users className="mr-2 h-5 w-5" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-h-[44px]">
            <Link href="/admin/devices">
              <MonitorSmartphone className="mr-2 h-5 w-5" />
              Manage Devices
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
