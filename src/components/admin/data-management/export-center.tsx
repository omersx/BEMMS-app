'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, FileText, FileJson, CheckSquare, Layers, ShieldCheck, Wrench, Building2, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

interface ExportCenterProps {
  summary: {
    devices: number;
    departments: number;
    categories: number;
    manufacturers: number;
    tickets: number;
    auditLogs: number;
  };
}

export function ExportCenter({ summary }: ExportCenterProps) {
  const [selectedEntities, setSelectedEntities] = useState<string[]>(['devices', 'departments']);
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [downloading, setDownloading] = useState(false);

  const toggleEntity = (entity: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entity) ? prev.filter((e) => e !== entity) : [...prev, entity]
    );
  };

  const handleSelectAll = () => {
    setSelectedEntities(['devices', 'departments', 'catalogs', 'tickets', 'audit_logs']);
  };

  const handleClearAll = () => {
    setSelectedEntities([]);
  };

  const handleExport = () => {
    if (selectedEntities.length === 0) {
      toast.error('Please select at least one dataset to export');
      return;
    }

    setDownloading(true);
    const query = new URLSearchParams({
      entities: selectedEntities.join(','),
      format,
    });

    const exportUrl = `/api/admin/data/export?${query.toString()}`;
    const link = document.createElement('a');
    link.href = exportUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      toast.success('Export started! Check your browser downloads.');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                Data Export & Backup Center
              </CardTitle>
              <CardDescription>
                Export medical equipment records, hospital structures, and maintenance histories for spreadsheets or migrations.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground">
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Datasets Selection Grid */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Select Datasets to Include</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Medical Devices */}
              <div
                onClick={() => toggleEntity('devices')}
                className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedEntities.includes('devices') ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={selectedEntities.includes('devices')} />
                  <div>
                    <h5 className="font-medium text-sm flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      Medical Equipment & Devices
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Asset tags, serial numbers, locations, status & criticality
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{summary.devices} items</Badge>
              </div>

              {/* Departments */}
              <div
                onClick={() => toggleEntity('departments')}
                className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedEntities.includes('departments') ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={selectedEntities.includes('departments')} />
                  <div>
                    <h5 className="font-medium text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      Hospitals & Departments
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Campus units, clinical departments, manager scopes
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{summary.departments} units</Badge>
              </div>

              {/* Master Catalogs */}
              <div
                onClick={() => toggleEntity('catalogs')}
                className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedEntities.includes('catalogs') ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={selectedEntities.includes('catalogs')} />
                  <div>
                    <h5 className="font-medium text-sm flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      Reference Catalogs
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Approved manufacturers and device categories
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {summary.categories + summary.manufacturers} records
                </Badge>
              </div>

              {/* Tickets */}
              <div
                onClick={() => toggleEntity('tickets')}
                className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedEntities.includes('tickets') ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={selectedEntities.includes('tickets')} />
                  <div>
                    <h5 className="font-medium text-sm flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-primary" />
                      Helpdesk Tickets & Work
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Incident logs, triage notes, and resolution history
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{summary.tickets} tickets</Badge>
              </div>

              {/* Audit Logs */}
              <div
                onClick={() => toggleEntity('audit_logs')}
                className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors md:col-span-2 ${
                  selectedEntities.includes('audit_logs') ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={selectedEntities.includes('audit_logs')} />
                  <div>
                    <h5 className="font-medium text-sm flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      21 CFR Part 11 Audit Trail
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Immutable record of access, signatures, and configuration changes
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{summary.auditLogs} logs</Badge>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-semibold">Choose Export Format</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setFormat('xlsx')}
                className={`p-4 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                  format === 'xlsx' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/40'
                }`}
              >
                <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h6 className="font-semibold text-sm">Microsoft Excel (.xlsx)</h6>
                  <p className="text-xs text-muted-foreground">
                    Native multi-sheet workbook with columns and styling.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                  format === 'csv' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/40'
                }`}
              >
                <FileText className="h-6 w-6 text-blue-600 shrink-0" />
                <div>
                  <h6 className="font-semibold text-sm">Standard CSV (.csv)</h6>
                  <p className="text-xs text-muted-foreground">
                    Includes UTF-8 BOM for full English & Arabic character support.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setFormat('json')}
                className={`p-4 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                  format === 'json' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/40'
                }`}
              >
                <FileJson className="h-6 w-6 text-indigo-600 shrink-0" />
                <div>
                  <h6 className="font-semibold text-sm">Structured JSON (.json)</h6>
                  <p className="text-xs text-muted-foreground">
                    Complete nested data format for developer backups and migrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button
            onClick={handleExport}
            disabled={downloading || selectedEntities.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing File...' : `Download ${format.toUpperCase()} Export`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
