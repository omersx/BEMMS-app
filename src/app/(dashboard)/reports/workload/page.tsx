import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { getWorkloadReport } from '@/lib/actions/reports';
import { ReportTransparencyHeader } from '@/components/reports/transparency-header';
import { ReportSummaryCards } from '@/components/reports/summary-cards';
import { ReportExportButton } from '@/components/reports/export-button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, Briefcase, Clock, Activity } from 'lucide-react';
import Link from 'next/link';

export default async function WorkloadReportPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const resolvedParams = await searchParams;

  const filters = {
    hospitalId: typeof resolvedParams.hospitalId === 'string' ? resolvedParams.hospitalId : undefined,
    departmentId: typeof resolvedParams.departmentId === 'string' ? resolvedParams.departmentId : undefined,
    startDate: typeof resolvedParams.startDate === 'string' ? resolvedParams.startDate : undefined,
    endDate: typeof resolvedParams.endDate === 'string' ? resolvedParams.endDate : undefined,
  };

  const rawData = await getWorkloadReport(filters as any);

  // Fetch engineer names
  const engineerIds = rawData.map(r => r.engineerId).filter((id): id is string => id !== null);
  let engineerMap = new Map<string, string>();
  
  if (engineerIds.length > 0) {
    const engineers = await db.select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, engineerIds));
      
    engineerMap = new Map(engineers.map(e => [e.id, e.fullName || 'Unknown Engineer']));
  }

  const data = rawData.map(r => ({
    ...r,
    name: r.engineerId ? engineerMap.get(r.engineerId) || r.engineerId : 'Unassigned',
  }));

  const totalEngineers = data.length;
  const totalAssigned = data.reduce((acc, curr) => acc + curr.assignedCount, 0);
  const totalCompleted = data.reduce((acc, curr) => acc + curr.completedCount, 0);

  const summaryItems = [
    { label: 'Total Engineers', value: totalEngineers, icon: Users },
    { label: 'Total Tasks Assigned', value: totalAssigned, icon: Briefcase },
    { label: 'Total Completed', value: totalCompleted, icon: Activity, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Reports</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Engineer Workload Report</h1>
      </div>

      <ReportTransparencyHeader
        reportType="workload"
        timezone="UTC"
        dateRange={{ start: filters.startDate, end: filters.endDate }}
        filters={filters as Record<string, string>}
        generatedAt={new Date()}
      />

      <ReportSummaryCards items={summaryItems} />

      {!data || data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No workload data found matching the selected filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {data.map((item) => (
              <Card key={item.engineerId || 'unassigned'}>
                <CardContent className="p-4 space-y-2">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Assigned: {item.assignedCount}</span>
                    <span className="text-green-600 font-medium">Completed: {item.completedCount}</span>
                    <span className="text-red-600 font-medium col-span-2">P1 Critical Completed: {item.priorityP1Completed}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Engineer Name</TableHead>
                  <TableHead className="text-right">Assigned Tasks</TableHead>
                  <TableHead className="text-right">Completed Tasks</TableHead>
                  <TableHead className="text-right text-red-600">P1 Critical Completed</TableHead>
                  <TableHead className="text-right">Completion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.engineerId || 'unassigned'}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.assignedCount}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{item.completedCount}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">{item.priorityP1Completed}</TableCell>
                    <TableCell className="text-right">
                      {item.assignedCount > 0 ? ((item.completedCount / item.assignedCount) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <ReportExportButton reportType="workload" filters={filters as Record<string, string>} />
      </div>
    </div>
  );
}
