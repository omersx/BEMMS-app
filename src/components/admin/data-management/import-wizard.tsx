'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, UploadCloud, FileText, CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { validateDeviceImport, executeDeviceImport } from '@/lib/actions/data-management';
import { getDeviceImportTemplateCSV } from '@/lib/utils/csv-parser';
import type { DeviceImportValidationResult } from '@/lib/validators/data-management';

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationData, setValidationData] = useState<{
    totalRows: number;
    validCount: number;
    warningCount: number;
    errorCount: number;
    rows: DeviceImportValidationResult[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = getDeviceImportTemplateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bemms_device_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded sample CSV import template');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidating(true);
    setValidationData(null);

    try {
      const text = await selectedFile.text();
      const res = await validateDeviceImport(text);

      if (res.success) {
        setValidationData({
          totalRows: res.totalRows,
          validCount: res.validCount,
          warningCount: res.warningCount,
          errorCount: res.errorCount,
          rows: res.rows,
        });
        toast.info(`Validated ${res.totalRows} rows from CSV`);
      } else {
        toast.error(res.error || 'Failed to validate CSV');
      }
    } catch {
      toast.error('Could not read or parse the selected file');
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationData) return;
    setImporting(true);

    try {
      const res = await executeDeviceImport(validationData.rows);
      if (res.success) {
        toast.success(`Successfully imported ${res.importedCount} medical equipment records!`);
        // Reset state
        setFile(null);
        setValidationData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error(res.error || 'Failed to complete import');
      }
    } catch {
      toast.error('An unexpected error occurred during import execution');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setValidationData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importableCount = validationData ? validationData.validCount + validationData.warningCount : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                Bulk Medical Equipment Import
              </CardTitle>
              <CardDescription>
                Import medical devices from spreadsheets with automatic categorization and dry-run validation.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2 shrink-0">
              <Download className="h-4 w-4" />
              Download Template CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: File Dropzone */}
          {!validationData && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 sm:p-12 text-center hover:border-primary/60 hover:bg-muted/30 transition-all cursor-pointer space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                {validating ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <UploadCloud className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-base">
                  {validating ? 'Validating CSV File...' : 'Click or drop your CSV file here'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports .csv files with standard BEMMS device headers (Asset Tag, Name, Category, Dept)
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Validation Preview Table */}
          {validationData && (
            <div className="space-y-4">
              {/* Summary Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-lg border">
                <div>
                  <span className="text-xs text-muted-foreground">Total Rows</span>
                  <div className="text-xl font-bold">{validationData.totalRows}</div>
                </div>
                <div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready to Import</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {validationData.validCount}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Warnings (Auto-Create)</span>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {validationData.warningCount}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-destructive font-medium">Errors (Skipped)</span>
                  <div className="text-xl font-bold text-destructive">{validationData.errorCount}</div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-x-auto max-h-[380px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Notes & Alerts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationData.rows.map((row) => (
                      <TableRow key={row.rowNumber} className={row.status === 'error' ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.rowNumber}</TableCell>
                        <TableCell>
                          {row.status === 'valid' && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </Badge>
                          )}
                          {row.status === 'warning' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Notice
                            </Badge>
                          )}
                          {row.status === 'error' && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Invalid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">{row.data.assetNumber || '—'}</TableCell>
                        <TableCell className="font-medium text-xs">{row.data.name || '—'}</TableCell>
                        <TableCell className="text-xs">{row.data.categoryName || '—'}</TableCell>
                        <TableCell className="text-xs">{row.data.departmentName || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs">
                          {row.messages.length > 0 ? row.messages.join(' • ') : 'Ready to import'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>

        {validationData && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-3">
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Choose Another File
            </Button>
            <Button
              onClick={handleExecuteImport}
              disabled={importing || importableCount === 0}
              className="gap-2 w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing Devices...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Confirm Import ({importableCount} Devices)
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
