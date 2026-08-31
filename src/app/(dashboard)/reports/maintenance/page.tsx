import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMaintenanceComplianceReport } from '@/lib/actions/reports';
import { ReportTransparencyHeader } from '@/components/reports/transparency-header';
import { ReportSummaryCards } from '@/components/reports/summary-cards';
import { ReportExportButton } from '@/components/reports/export-button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, CheckCircle, AlertTriangle, Percent } from 'lucide-react';
import Link from 'next/link';

export default async function MaintenanceComplianceReportPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const resolvedParams = await searchParams;

  const filters = {
    hospitalId: typeof resolvedParams.hospitalId === 'string' ? resolvedParams.hospitalId : undefined,
    departmentId: typeof resolvedParams.departmentId === 'string' ? resolvedParams.departmentId : undefined,
    startDate: typeof resolvedParams.startDate === 'string' ? resolvedParams.startDate : undefined,
    endDate: typeof resolvedParams.endDate === 'string' ? resolvedParams.endDate : undefined,
  };

  const data = await getMaintenanceComplianceReport(filters as any);

  const summaryItems = [
    { label: 'Total Scheduled', value: data?.totalScheduled || 0, icon: Calendar },
    { label: 'Completed', value: data?.completed || 0, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Overdue', value: data?.overdue || 0, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Compliance Rate', value: `${(data?.complianceRate || 0).toFixed(1)}%`, icon: Percent, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Reports</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">PM Compliance Report</h1>
      </div>

      <ReportTransparencyHeader
        reportType="maintenance"
        timezone="UTC"
        dateRange={{ start: filters.startDate, end: filters.endDate }}
        filters={filters as Record<string, string>}
        generatedAt={new Date()}
      />

      <ReportSummaryCards items={summaryItems} />

      {!data || data.totalScheduled === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No maintenance tasks found matching the selected filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="my-6">
            <h3 className="text-sm font-medium mb-2">Overall Compliance</h3>
            <div className="w-full bg-secondary rounded-full h-4">
              <div 
                className="bg-primary h-4 rounded-full transition-all" 
                style={{ width: `${Math.min(100, Math.max(0, data.complianceRate))}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {data.complianceRate.toFixed(1)}% Completed
            </p>
          </div>

          <div className="grid gap-4 md:hidden">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold mb-2">Status Breakdown</div>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <span className="text-green-600 font-medium">Completed: {data.completed}</span>
                  <span className="text-red-600 font-medium">Overdue: {data.overdue}</span>
                  <span className="font-medium text-foreground col-span-2">Total Scheduled: {data.totalScheduled}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-green-600">Completed</TableCell>
                  <TableCell className="text-right">{data.completed}</TableCell>
                  <TableCell className="text-right">
                    {data.totalScheduled > 0 ? ((data.completed / data.totalScheduled) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-red-600">Overdue</TableCell>
                  <TableCell className="text-right">{data.overdue}</TableCell>
                  <TableCell className="text-right">
                    {data.totalScheduled > 0 ? ((data.overdue / data.totalScheduled) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Other</TableCell>
                  <TableCell className="text-right">{data.totalScheduled - data.completed - data.overdue}</TableCell>
                  <TableCell className="text-right">
                    {data.totalScheduled > 0 ? (((data.totalScheduled - data.completed - data.overdue) / data.totalScheduled) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total Scheduled</TableCell>
                  <TableCell className="text-right">{data.totalScheduled}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <ReportExportButton reportType="maintenance" filters={filters as Record<string, string>} />
      </div>
    </div>
  );
}
