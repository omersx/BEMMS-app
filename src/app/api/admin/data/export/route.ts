import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { db } from '@/lib/db';
import { generateCSV } from '@/lib/utils/export';
import * as XLSX from 'xlsx';

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

      if (selectedEntities.includes('rounds')) {
        exportPayload.data.engineerRounds = await db.query.engineerRounds.findMany({
          with: {
            engineer: { columns: { id: true, fullName: true, email: true } },
            hospital: { columns: { id: true, name: true } },
            departmentVisits: {
              with: {
                department: { columns: { id: true, name: true, code: true } },
                notes: true,
              },
            },
          },
        });
      }

      return new NextResponse(JSON.stringify(exportPayload, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="bemms_export_${timestamp}.json"`,
        },
      });
    }

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();

      if (selectedEntities.includes('devices')) {
        const rawDevices = await db.query.devices.findMany({
          with: { deviceCategory: true, manufacturer: true, department: true },
        });
        const formatted = rawDevices.map((d) => ({
          'Asset Number': d.assetNumber,
          'Device Name': d.name,
          'Model': d.modelNameFree || '',
          'Serial Number': d.serialNumber || '',
          'Category': d.deviceCategory?.name || '',
          'Manufacturer': d.manufacturer?.name || '',
          'Department': d.department?.name || '',
          'Location': d.exactLocationDescription || '',
          'Status': d.currentStatusCode,
          'Criticality': d.criticalityLevel || 'medium',
          'Risk Class': d.riskClassification || '',
        }));
        const ws = XLSX.utils.json_to_sheet(formatted);
        XLSX.utils.book_append_sheet(wb, ws, 'Devices');
      }

      if (selectedEntities.includes('departments')) {
        const rawDeps = await db.query.departments.findMany({
          with: { hospital: true },
        });
        const formatted = rawDeps.map((d) => ({
          'Department Name': d.name,
          'Code': d.code,
          'Department Type': d.departmentType,
          'Hospital Name': d.hospital?.name || '',
          'Status': d.status || 'active',
          'Created At': d.createdAt?.toISOString() || '',
        }));
        const ws = XLSX.utils.json_to_sheet(formatted);
        XLSX.utils.book_append_sheet(wb, ws, 'Departments');
      }

      if (selectedEntities.includes('rounds')) {
        const rawRounds = await db.query.engineerRounds.findMany({
          with: {
            engineer: true,
            hospital: true,
            departmentVisits: {
              with: {
                notes: true,
              },
            },
          },
        });

        const formatted = rawRounds.map((r) => ({
          'Round Date': r.roundDate,
          'Shift': r.shiftType,
          'Engineer': r.engineer?.fullName || '',
          'Hospital': r.hospital?.name || '',
          'Status': r.status,
          'Started At': r.startedAt?.toISOString() || '',
          'Completed At': r.completedAt?.toISOString() || '',
          'Total Departments': r.totalDepartments,
          'Completed Departments': r.completedDepartments,
          'Issues Reported': r.totalIssuesReported,
          'Total Notes': r.totalNotes,
        }));
        const ws = XLSX.utils.json_to_sheet(formatted);
        XLSX.utils.book_append_sheet(wb, ws, 'Daily Rounds');

        const visitRows: any[] = [];
        for (const r of rawRounds) {
          for (const v of r.departmentVisits || []) {
            const notesText = (v.notes || []).map((n: any) => n.noteText).join(' | ');
            visitRows.push({
              'Round Date': r.roundDate,
              'Engineer': r.engineer?.fullName || '',
              'Department': v.departmentName,
              'Sequence': v.sequence,
              'Status': v.status,
              'Started At': v.startedAt?.toISOString() || '',
              'Completed At': v.completedAt?.toISOString() || '',
              'Notes': notesText,
            });
          }
        }
        if (visitRows.length > 0) {
          const wsVisits = XLSX.utils.json_to_sheet(visitRows);
          XLSX.utils.book_append_sheet(wb, wsVisits, 'Department Visits');
        }
      }

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="bemms_export_${timestamp}.xlsx"`,
        },
      });
    }

    if (format === 'csv') {
      if (selectedEntities.includes('departments') && !selectedEntities.includes('devices')) {
        const rawDeps = await db.query.departments.findMany({
          with: { hospital: true },
        });

        const formatted = rawDeps.map((d) => ({
          name: d.name,
          code: d.code,
          type: d.departmentType,
          hospital: d.hospital?.name || '',
          status: d.status || 'active',
          createdAt: d.createdAt?.toISOString() || '',
        }));

        const columns = [
          { key: 'name', header: 'Department Name' },
          { key: 'code', header: 'Code' },
          { key: 'type', header: 'Department Type' },
          { key: 'hospital', header: 'Hospital Name' },
          { key: 'status', header: 'Status' },
          { key: 'createdAt', header: 'Created At' },
        ];

        const csvContent = generateCSV(formatted, columns);

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="bemms_departments_${timestamp}.csv"`,
          },
        });
      }

      if (selectedEntities.includes('rounds')) {
        const rawRounds = await db.query.engineerRounds.findMany({
          with: { engineer: true, hospital: true },
        });

        const formatted = rawRounds.map((r) => ({
          roundDate: r.roundDate,
          shiftType: r.shiftType,
          engineerName: r.engineer?.fullName || '',
          hospitalName: r.hospital?.name || '',
          status: r.status,
          startedAt: r.startedAt?.toISOString() || '',
          completedAt: r.completedAt?.toISOString() || '',
          totalDepartments: r.totalDepartments,
          completedDepartments: r.completedDepartments,
          totalIssuesReported: r.totalIssuesReported,
          totalNotes: r.totalNotes,
        }));

        const columns = [
          { key: 'roundDate', header: 'Round Date' },
          { key: 'shiftType', header: 'Shift' },
          { key: 'engineerName', header: 'Engineer Name' },
          { key: 'hospitalName', header: 'Hospital' },
          { key: 'status', header: 'Status' },
          { key: 'startedAt', header: 'Started At' },
          { key: 'completedAt', header: 'Completed At' },
          { key: 'totalDepartments', header: 'Total Depts' },
          { key: 'completedDepartments', header: 'Completed Depts' },
          { key: 'totalIssuesReported', header: 'Issues Reported' },
          { key: 'totalNotes', header: 'Notes' },
        ];

        const csvContent = generateCSV(formatted, columns);

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="bemms_engineer_rounds_${timestamp}.csv"`,
          },
        });
      }

      // Default to devices
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

    return new NextResponse('Export complete', { status: 200 });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message || 'Export failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

