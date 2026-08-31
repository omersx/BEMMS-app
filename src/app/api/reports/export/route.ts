import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { getInventoryReport, getTicketPerformanceReport, getCostReport, getWorkloadReport } from '@/lib/actions/reports';
import { generateCSV, formatReportMetadata } from '@/lib/utils/export';
import { saveReportToHistory } from '@/lib/actions/report-history';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await requirePermission('REPORTS', 'VIEW');

    const searchParams = req.nextUrl.searchParams;
    const reportType = searchParams.get('type') || searchParams.get('reportType');
    
    // Parse filters
    const filters = Object.fromEntries(searchParams.entries());

    let data: any[] = [];
    let columns: { key: string; header: string }[] = [];

    if (reportType === 'inventory') {
      const results = await getInventoryReport(filters);
      data = results;
      columns = [
        { key: 'groupId', header: 'Group' },
        { key: 'totalCount', header: 'Total Devices' },
        { key: 'operationalCount', header: 'Operational' },
        { key: 'maintenanceCount', header: 'Under Maintenance' },
        { key: 'outOfServiceCount', header: 'Out of Service' },
        { key: 'decommissionedCount', header: 'Decommissioned' }
      ];
    } else if (reportType === 'tickets') {
      const results = await getTicketPerformanceReport(filters);
      data = [results];
      columns = [
        { key: 'total', header: 'Total Tickets' },
        { key: 'openCount', header: 'Open Tickets' },
        { key: 'closedCount', header: 'Closed Tickets' },
        { key: 'avgResponseTime', header: 'Avg Response Time (hrs)' },
        { key: 'avgResolutionTime', header: 'Avg Resolution Time (hrs)' },
        { key: 'priorityP1', header: 'P1 Critical' },
        { key: 'priorityP2', header: 'P2 High' },
        { key: 'priorityP3', header: 'P3 Normal' },
        { key: 'priorityP4', header: 'P4 Low' }
      ];
    } else if (reportType === 'costs') {
      const results = await getCostReport(filters);
      data = results.byCostType;
      columns = [
        { key: 'costType', header: 'Cost Type' },
        { key: 'totalAmount', header: 'Total Amount' },
        { key: 'count', header: 'Record Count' }
      ];
    } else if (reportType === 'workload') {
      const results = await getWorkloadReport(filters);
      data = results;
      columns = [
        { key: 'engineerId', header: 'Engineer ID' },
        { key: 'assignedCount', header: 'Total Tasks' },
        { key: 'completedCount', header: 'Completed Tasks' },
        { key: 'inProgressCount', header: 'In Progress Tasks' },
        { key: 'priorityP1Count', header: 'P1 Critical Tasks' },
        { key: 'pmCount', header: 'Preventive Tasks' }
      ];
    } else {
      return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 });
    }

    const csvData = generateCSV(data, columns);
    const metadata = formatReportMetadata({
      reportType,
      filters,
      timezone: filters.timezone || 'UTC',
      generatedAt: new Date(),
      generatedBy: user.fullName || user.email,
    });

    const finalCsv = metadata + csvData;
    const fileName = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;

    await saveReportToHistory({
      reportType,
      title: `${reportType} Report`,
      filters,
      rowCount: data.length,
      fileFormat: 'csv',
      fileName
    });

    return new NextResponse(finalCsv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
