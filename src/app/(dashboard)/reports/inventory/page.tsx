import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getInventoryReport } from '@/lib/actions/reports';
import { ReportTransparencyHeader } from '@/components/reports/transparency-header';
import { ReportSummaryCards } from '@/components/reports/summary-cards';
import { ReportExportButton } from '@/components/reports/export-button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, Wrench, AlertTriangle, Monitor } from 'lucide-react';
import Link from 'next/link';

export default async function InventoryReportPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const resolvedParams = await searchParams;

  const filters = {
    groupBy: (typeof resolvedParams.groupBy === 'string' ? resolvedParams.groupBy : 'department') as any,
    hospitalId: typeof resolvedParams.hospitalId === 'string' ? resolvedParams.hospitalId : undefined,
    departmentId: typeof resolvedParams.departmentId === 'string' ? resolvedParams.departmentId : undefined,
    deviceCategoryId: typeof resolvedParams.deviceCategoryId === 'string' ? resolvedParams.deviceCategoryId : undefined,
    status: typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined,
  };

  const data = await getInventoryReport(filters as any);

  const totalDevices = data.reduce((acc, curr) => acc + curr.totalCount, 0);
  const operationalDevices = data.reduce((acc, curr) => acc + curr.operationalCount, 0);
  const maintenanceDevices = data.reduce((acc, curr) => acc + curr.maintenanceCount, 0);
  const outOfServiceDevices = data.reduce((acc, curr) => acc + (curr.outOfServiceCount || 0), 0);

  const summaryItems = [
    { label: 'Total Devices', value: totalDevices, icon: Monitor },
    { label: 'Operational', value: operationalDevices, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Under Maintenance', value: maintenanceDevices, icon: Wrench, color: 'text-yellow-600' },
    { label: 'Out of Service', value: outOfServiceDevices, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Reports</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Report</h1>
      </div>

      <ReportTransparencyHeader
        reportType="inventory"
        timezone="UTC"
        filters={filters as Record<string, string>}
        generatedAt={new Date()}
      />

      <ReportSummaryCards items={summaryItems} />

      {data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No inventory data found matching the selected filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {data.map((item) => (
              <Card key={String(item.groupId)}>
                <CardContent className="p-4 space-y-2">
                  <div className="font-semibold">{item.groupId || 'Unknown Group'}</div>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <span className="text-green-600">Operational: {item.operationalCount}</span>
                    <span className="text-yellow-600">Maintenance: {item.maintenanceCount}</span>
                    <span className="text-red-600">Out of Service: {item.decommissionedCount}</span>
                    <span className="font-medium text-foreground">Total: {item.totalCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Group</TableHead>
                  <TableHead className="text-right">Operational</TableHead>
                  <TableHead className="text-right">Under Maintenance</TableHead>
                  <TableHead className="text-right">Out of Service</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={String(item.groupId)}>
                    <TableCell className="font-medium">{item.groupId || 'Unknown Group'}</TableCell>
                    <TableCell className="text-right text-green-600">{item.operationalCount}</TableCell>
                    <TableCell className="text-right text-yellow-600">{item.maintenanceCount}</TableCell>
                    <TableCell className="text-right text-red-600">{item.decommissionedCount}</TableCell>
                    <TableCell className="text-right font-bold">{item.totalCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <ReportExportButton reportType="inventory" filters={filters as Record<string, string>} />
      </div>
    </div>
  );
}
