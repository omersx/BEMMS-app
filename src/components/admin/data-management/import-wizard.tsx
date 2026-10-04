'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Layers, 
  Building2,
  Info 
} from 'lucide-react';
import { toast } from 'sonner';

// Next lines are ignored if they don't exist yet, per instructions they will be added later
import { 
  validateDeviceImport, 
  executeDeviceImport,
  validateDepartmentImport,
  executeDepartmentImport
} from '@/lib/actions/data-management';

import { 
  getDeviceImportTemplateCSV,
  getDepartmentImportTemplateCSV
} from '@/lib/utils/csv-parser';

import type { DeviceImportValidationResult } from '@/lib/validators/data-management';

type EntityType = 'devices' | 'departments';

interface ValidationData {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  rows: any[]; // any to accommodate both devices and departments
}

export function ImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [entity, setEntity] = useState<EntityType>('devices');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [importedCount, setImportedCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async (format: 'csv' | 'excel') => {
    try {
      const csvContent = entity === 'devices' 
        ? getDeviceImportTemplateCSV() 
        : getDepartmentImportTemplateCSV();

      if (format === 'excel') {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(csvContent, { type: 'string' });
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bemms_${entity}_template.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${entity} Excel template (.xlsx)`);
      } else {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bemms_${entity}_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${entity} CSV template (.csv)`);
      }
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const parseFileToCsv = async (fileToParse: File): Promise<string> => {
    if (fileToParse.name.endsWith('.csv')) {
      return await fileToParse.text();
    } else if (fileToParse.name.endsWith('.xlsx') || fileToParse.name.endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const data = await fileToParse.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_csv(sheet);
    }
    throw new Error('Unsupported file format');
  };

  const handleFileSet = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      setFile(selectedFile);
    } else {
      toast.error('Please upload a .csv, .xlsx, or .xls file');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSet(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSet(selectedFile);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    
    setValidating(true);
    setValidationData(null);

    try {
      const csvText = await parseFileToCsv(file);
      
      let res;
      if (entity === 'devices') {
        res = await validateDeviceImport(csvText);
      } else {
        res = await validateDepartmentImport(csvText);
      }

      if (res.success) {
        setValidationData({
          totalRows: res.totalRows,
          validCount: res.validCount,
          warningCount: res.warningCount,
          errorCount: res.errorCount,
          rows: res.rows,
        });
        toast.info(`Validated ${res.totalRows} rows`);
        setStep(2);
      } else {
        toast.error(res.error || 'Failed to validate file');
      }
    } catch (error) {
      toast.error('Could not read or parse the selected file');
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationData) return;
    setImporting(true);

    try {
      let res;
      if (entity === 'devices') {
        res = await executeDeviceImport(validationData.rows);
      } else {
        res = await executeDepartmentImport(validationData.rows);
      }
      
      if (res.success) {
        toast.success(`Successfully imported ${res.importedCount} records!`);
        setImportedCount(res.importedCount);
        setStep(3);
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
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importableCount = validationData ? validationData.validCount + validationData.warningCount : 0;

  return (
    <div className="space-y-6">
      {/* 1. Entity Type Selector */}
      {step === 1 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:border-primary/50 ${entity === 'devices' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setEntity('devices')}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`p-2 rounded-full ${entity === 'devices' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-base">Medical Devices</h3>
                <p className="text-sm text-muted-foreground">Import equipment and assets</p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:border-primary/50 ${entity === 'departments' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setEntity('departments')}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`p-2 rounded-full ${entity === 'departments' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-base">Departments</h3>
                <p className="text-sm text-muted-foreground">Import hospital departments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relationship Workflow Guidance */}
        {entity === 'devices' ? (
          <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-900 dark:text-blue-200">
            <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">Recommended Sequence</span>
              <p className="text-xs text-blue-800/90 dark:text-blue-200">
                Medical devices are associated with hospital departments. If your facility has new or unlisted wards,{' '}
                <button
                  type="button"
                  onClick={() => setEntity('departments')}
                  className="font-semibold underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-100"
                >
                  import departments first
                </button>
                , then import devices referencing those department names.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-900 dark:text-emerald-200">
            <Info className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Organizational Hierarchy</span>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-200">
                Importing departments registers hospital clinical areas (e.g. ICU, Radiology, Emergency). Once imported, you can immediately switch to{' '}
                <button
                  type="button"
                  onClick={() => setEntity('devices')}
                  className="font-semibold underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-100"
                >
                  importing medical devices
                </button>{' '}
                to assign assets to them.
              </p>
            </div>
          </div>
        )}
      </>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                Data Import Wizard
              </CardTitle>
              <CardDescription>
                Follow the steps to import data into the system
              </CardDescription>
            </div>
            
            {/* 2. Three-Step Visual Stepper */}
            <div className="relative py-4">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2"></div>
              <div className="relative flex justify-between">
                <div className="flex flex-col items-center gap-2 bg-card px-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-muted text-muted-foreground'}`}>
                    {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                  </div>
                  <span className="text-xs font-medium">Upload</span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-card px-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-muted text-muted-foreground'}`}>
                    {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                  </div>
                  <span className="text-xs font-medium">Preview</span>
                </div>
                <div className="flex flex-col items-center gap-2 bg-card px-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-muted text-muted-foreground'}`}>
                    {step > 3 ? <CheckCircle2 className="h-5 w-5" /> : '3'}
                  </div>
                  <span className="text-xs font-medium">Results</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Step 1: Upload Zone */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => handleDownloadTemplate('csv')} className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Download CSV Template
                </Button>
                <Button variant="outline" onClick={() => handleDownloadTemplate('excel')} className="flex-1 gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Excel Template
                </Button>
              </div>
              
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl min-h-[200px] p-8 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                {!file ? (
                  <>
                    <UploadCloud className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-bold text-lg">Drop your file here</p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV and Excel (.xlsx, .xls) files
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center gap-3 bg-muted p-4 rounded-lg">
                      {file.name.endsWith('.csv') ? (
                        <FileText className="h-8 w-8 text-primary" />
                      ) : (
                        <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                      )}
                      <div className="text-left text-sm">
                        <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="ml-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {file && (
                <div className="flex justify-end">
                  <Button onClick={handleValidate} disabled={validating} className="w-full sm:w-auto">
                    {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Validate & Preview
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview (Validation Results) */}
          {step === 2 && validationData && (
            <div className="space-y-4">
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
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Warnings</span>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {validationData.warningCount}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-destructive font-medium">Errors</span>
                  <div className="text-xl font-bold text-destructive">{validationData.errorCount}</div>
                </div>
              </div>

              <div className="border rounded-lg overflow-x-auto max-h-[380px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Status</TableHead>
                      {entity === 'devices' ? (
                        <>
                          <TableHead>Asset Tag</TableHead>
                          <TableHead>Device Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Department</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Department Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Hospital</TableHead>
                        </>
                      )}
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationData.rows.map((row: any) => (
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
                        {entity === 'devices' ? (
                          <>
                            <TableCell className="font-mono text-xs font-semibold">{row.data.assetNumber || '—'}</TableCell>
                            <TableCell className="font-medium text-xs">{row.data.name || '—'}</TableCell>
                            <TableCell className="text-xs">{row.data.categoryName || '—'}</TableCell>
                            <TableCell className="text-xs">{row.data.departmentName || '—'}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium text-xs">{row.data.name || '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{row.data.code || '—'}</TableCell>
                            <TableCell className="text-xs">{row.data.departmentType || '—'}</TableCell>
                            <TableCell className="text-xs">{row.data.hospitalName || '—'}</TableCell>
                          </>
                        )}
                        <TableCell className="text-xs text-muted-foreground max-w-xs">
                          {row.messages?.length > 0 ? row.messages.join(' • ') : 'Ready to import'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              <h2 className="text-2xl font-bold">Import Completed Successfully</h2>
              <p className="text-muted-foreground">
                {importedCount} records imported into the system
              </p>
              <Button onClick={handleReset} variant="outline" className="mt-4 gap-2">
                <RotateCcw className="h-4 w-4" />
                Import Another File
              </Button>
            </div>
          )}
        </CardContent>

        {step === 2 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Button>
            <Button
              onClick={handleExecuteImport}
              disabled={importing || importableCount === 0}
              className="gap-2 w-full sm:w-auto"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              {!importing && <ArrowRight className="h-4 w-4" />}
              Confirm Import ({importableCount} Records)
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
