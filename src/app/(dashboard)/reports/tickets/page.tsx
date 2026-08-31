import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTicketPerformanceReport } from '@/lib/actions/reports';
import { ReportTransparencyHeader } from '@/components/reports/transparency-header';
import { ReportSummaryCards } from '@/components/reports/summary-cards';
import { ReportExportButton } from '@/components/reports/export-button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Ticket, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function formatHours(hours: number | null | undefined): string {
  if (hours == null) return 'N/A';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default async function TicketPerformanceReportPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const resolvedParams = await searchParams;

  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);

  const filters = {
    hospitalId: typeof resolvedParams.hospitalId === 'string' ? resolvedParams.hospitalId : undefined,
    departmentId: typeof resolvedParams.departmentId === 'string' ? resolvedParams.departmentId : undefined,
    startDate: typeof resolvedParams.startDate === 'string' ? resolvedParams.startDate : defaultStartDate.toISOString(),
    endDate: typeof resolvedParams.endDate === 'string' ? resolvedParams.endDate : new Date().toISOString(),
  };

  const data = await getTicketPerformanceReport(filters as any);

  const summaryItems = [
    { label: 'Total Tickets', value: data?.total || 0, icon: Ticket },
    { label: 'Open', value: data?.openCount || 0, icon: AlertCircle, color: 'text-yellow-600' },
    { label: 'Resolved', value: data?.closedCount || 0, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Avg Response', value: formatHours(data?.avgResponseTime), icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Reports</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Ticket Performance Report</h1>
      </div>

      <ReportTransparencyHeader
        reportType="tickets"
        timezone="UTC"
        dateRange={{ start: filters.startDate, end: filters.endDate }}
        filters={filters as Record<string, string>}
        generatedAt={new Date()}
      />

      <ReportSummaryCards items={summaryItems} />

      {!data || data.total === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No ticket data found matching the selected filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold mb-2">Priority Breakdown</div>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <span className="text-red-600 font-medium">P1 Critical: {data.priorityP1 || 0}</span>
                  <span className="text-orange-600 font-medium">P2 High: {data.priorityP2 || 0}</span>
                  <span className="text-yellow-600 font-medium">P3 Normal: {data.priorityP3 || 0}</span>
                  <span className="text-green-600 font-medium">P4 Low: {data.priorityP4 || 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold mb-2">Resolution Metrics</div>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <span>Avg Response:</span>
                  <span className="font-medium">{formatHours(data.avgResponseTime)}</span>
                  <span>Avg Resolution:</span>
                  <span className="font-medium">{formatHours(data.avgResolutionTime)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Priority 1 (Critical)</TableCell>
                  <TableCell className="text-right text-red-600 font-medium">{data.priorityP1 || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Priority 2 (High)</TableCell>
                  <TableCell className="text-right text-orange-600 font-medium">{data.priorityP2 || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Priority 3 (Normal)</TableCell>
                  <TableCell className="text-right text-yellow-600 font-medium">{data.priorityP3 || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Priority 4 (Low)</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">{data.priorityP4 || 0}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Avg Resolution Time</TableCell>
                  <TableCell className="text-right font-medium">{formatHours(data.avgResolutionTime)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <ReportExportButton reportType="tickets" filters={filters as Record<string, string>} />
      </div>
    </div>
  );
}
