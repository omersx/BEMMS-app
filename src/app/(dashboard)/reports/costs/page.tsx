import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCostReport } from '@/lib/actions/reports';
import { ReportTransparencyHeader } from '@/components/reports/transparency-header';
import { ReportSummaryCards } from '@/components/reports/summary-cards';
import { ReportExportButton } from '@/components/reports/export-button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, DollarSign, Wrench, Briefcase, Settings } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
}

export default async function CostReportPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session) redirect('/login');

  const resolvedParams = await searchParams;

  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 90);

  const filters = {
    hospitalId: typeof resolvedParams.hospitalId === 'string' ? resolvedParams.hospitalId : undefined,
    departmentId: typeof resolvedParams.departmentId === 'string' ? resolvedParams.departmentId : undefined,
    startDate: typeof resolvedParams.startDate === 'string' ? resolvedParams.startDate : defaultStartDate.toISOString(),
    endDate: typeof resolvedParams.endDate === 'string' ? resolvedParams.endDate : new Date().toISOString(),
  };

  const data = await getCostReport(filters as any);

  const getAmountByType = (type: string) => {
    return data.byCostType.find(c => c.costType === type)?.totalAmount || 0;
  };

  const partsAmount = getAmountByType('parts');
  const vendorAmount = getAmountByType('vendor_service');
  const laborAmount = getAmountByType('labor');

  const summaryItems = [
    { label: 'Total Cost', value: formatCurrency(data.totalCost), icon: DollarSign, color: 'text-primary' },
    { label: 'Parts', value: formatCurrency(partsAmount), icon: Settings },
    { label: 'Vendor Services', value: formatCurrency(vendorAmount), icon: Briefcase },
    { label: 'Labor', value: formatCurrency(laborAmount), icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Reports</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Cost Report</h1>
      </div>

      <ReportTransparencyHeader
        reportType="costs"
        timezone="UTC"
        dateRange={{ start: filters.startDate, end: filters.endDate }}
        filters={filters as Record<string, string>}
        generatedAt={new Date()}
      />

      <ReportSummaryCards items={summaryItems} />

      {!data || data.byCostType.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No cost data found matching the selected filters.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:hidden">
            {data.byCostType.map((item) => (
              <Card key={item.costType}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="font-semibold capitalize">{item.costType?.replace('_', ' ') || 'Unknown'}</div>
                  <div className="font-medium">{formatCurrency(item.totalAmount)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byCostType.map((item) => (
                  <TableRow key={item.costType}>
                    <TableCell className="font-medium capitalize">{item.costType?.replace('_', ' ') || 'Unknown'}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.totalAmount)}</TableCell>
                    <TableCell className="text-right">
                      {data.totalCost > 0 ? ((item.totalAmount / data.totalCost) * 100).toFixed(1) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.totalCost)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <ReportExportButton reportType="costs" filters={filters as Record<string, string>} />
      </div>
    </div>
  );
}
