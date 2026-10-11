'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportAuditLogs, type AuditLogFilters } from '@/lib/actions/audit-logs';

export interface AuditLogExportProps {
  filters: AuditLogFilters;
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Client component to export audit log records matching the active filters to a CSV file.
 */
export function AuditLogExport({ filters }: AuditLogExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportAuditLogs(filters);
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to fetch audit logs for export');
      }

      const rows = res.data;
      const headers = [
        'Timestamp',
        'Actor Name',
        'Actor Email',
        'Action',
        'Entity Type',
        'Entity ID',
        'Reason',
        'IP Address',
      ];

      const csvRows = [headers.join(',')];

      for (const log of rows) {
        const timestamp = log.timestamp
          ? new Date(log.timestamp).toISOString()
          : '';
        const actorName = log.actorUser?.fullName || 'System';
        const actorEmail = log.actorUser?.email || '';
        const action = log.actionType || '';
        const entityType = log.entityType || '';
        const entityId = log.entityId || '';
        const reason = log.changeReason || '';
        const ipAddress = log.ipAddress || '';

        const rowValues = [
          escapeCsvField(timestamp),
          escapeCsvField(actorName),
          escapeCsvField(actorEmail),
          escapeCsvField(action),
          escapeCsvField(entityType),
          escapeCsvField(entityId),
          escapeCsvField(reason),
          escapeCsvField(ipAddress),
        ];

        csvRows.push(rowValues.join(','));
      }

      const csvContent = csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const timestampSlug = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${timestampSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Audit log export error:', error);
      alert('Failed to export audit logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="h-9 gap-1.5 font-medium"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </>
      )}
    </Button>
  );
}
