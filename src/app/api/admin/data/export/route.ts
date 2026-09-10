import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { db } from '@/lib/db';
import { generateCSV } from '@/lib/utils/export';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');

    const searchParams = req.nextUrl.searchParams;
    const entityParam = searchParams.get('entities') || 'devices';
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    const selectedEntities = entityParam.split(',').map((e) => e.trim());
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'json') {
      const exportPayload: Record<string, any> = {
        metadata: {
          system: 'BEMMS Medical Equipment Management System',
          exportedAt: new Date().toISOString(),
          exportedBy: session.email,
          entities: selectedEntities,
        },
        data: {},
      };

      if (selectedEntities.includes('devices')) {
        exportPayload.data.devices = await db.query.devices.findMany({
          with: {
            deviceCategory: true,
            manufacturer: true,
            department: true,
          },
        });
      }

      if (selectedEntities.includes('departments')) {
        exportPayload.data.departments = await db.query.departments.findMany();
      }

      if (selectedEntities.includes('catalogs')) {
        exportPayload.data.categories = await db.query.deviceCategories.findMany();
        exportPayload.data.manufacturers = await db.query.manufacturers.findMany();
      }

      if (selectedEntities.includes('tickets')) {
        exportPayload.data.tickets = await db.query.serviceTickets.findMany({
          with: { device: true },
        });
      }

      if (selectedEntities.includes('audit_logs')) {
        exportPayload.data.auditLogs = await db.query.auditLogs.findMany({
          limit: 1000,
        });
      }

      return new NextResponse(JSON.stringify(exportPayload, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="bemms_export_${timestamp}.json"`,
        },
      });
    }

    // CSV format: Default to devices if multiple or specific entity
    if (selectedEntities.includes('devices') || selectedEntities.length === 1) {
      const rawDevices = await db.query.devices.findMany({
        with: {
          deviceCategory: true,
          manufacturer: true,
          department: true,
        },
      });

      const formatted = rawDevices.map((d) => ({
        assetNumber: d.assetNumber,
        name: d.name,
        model: d.modelNameFree || '',
        serialNumber: d.serialNumber || '',
        category: d.deviceCategory?.name || '',
        manufacturer: d.manufacturer?.name || '',
        department: d.department?.name || '',
        location: d.exactLocationDescription || '',
        status: d.currentStatusCode,
        criticality: d.criticalityLevel || 'medium',
        riskClassification: d.riskClassification || '',
      }));

      const columns = [
        { key: 'assetNumber', header: 'Asset Number' },
        { key: 'name', header: 'Device Name' },
        { key: 'model', header: 'Model' },
        { key: 'serialNumber', header: 'Serial Number' },
        { key: 'category', header: 'Category' },
        { key: 'manufacturer', header: 'Manufacturer' },
        { key: 'department', header: 'Department' },
        { key: 'location', header: 'Location' },
        { key: 'status', header: 'Status' },
        { key: 'criticality', header: 'Criticality' },
        { key: 'riskClassification', header: 'Risk Class' },
      ];

      const csvContent = generateCSV(formatted, columns);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="bemms_devices_${timestamp}.csv"`,
        },
      });
    }

    // Default fallback
    return new NextResponse('Export complete', { status: 200 });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message || 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
