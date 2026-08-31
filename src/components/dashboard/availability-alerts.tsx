'use client';

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MonitorSmartphone } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

interface UnavailableDevice {
  id: string;
  name: string;
  assetNumber: string;
  currentStatusCode: string;
  departmentName?: string | null;
  locationDescription?: string | null;
}

interface AvailabilityAlertsProps {
  devices: UnavailableDevice[];
}

export function AvailabilityAlerts({ devices }: AvailabilityAlertsProps) {
  return (
    <Card className="border-orange-200 shadow-sm">
      <CardHeader className="pb-3 bg-orange-50/50 rounded-t-xl border-b border-orange-100">
        <CardTitle className="text-lg flex items-center text-orange-800">
          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
          Unavailable Devices
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {devices.length === 0 ? (
          <div className="text-center py-6 text-sm text-green-700 bg-green-50 rounded-md border border-green-100 flex flex-col items-center gap-2">
            <MonitorSmartphone className="h-8 w-8 text-green-500 opacity-80" />
            <p>All department devices are operational.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <Link key={device.id} href={`/devices/${device.id}`} className="block">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-orange-100 bg-white rounded-lg hover:bg-orange-50/30 transition-colors gap-2 min-h-[44px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{device.assetNumber}</span>
                      <StatusBadge status={device.currentStatusCode} />
                    </div>
                    <span className="text-sm font-medium">{device.name}</span>
                    <span className="text-xs text-muted-foreground flex gap-1 items-center">
                      {device.departmentName} 
                      {device.locationDescription && (
                        <>
                          <span>•</span>
                          <span>{device.locationDescription}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
