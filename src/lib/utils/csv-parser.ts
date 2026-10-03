/**
 * Robust CSV parser that handles quotes, escaped quotes, and newlines.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const cleanText = text.replace(/^\uFEFF/, '').trim(); // Remove BOM if present
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Skip CR in CRLF
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Flush remaining field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Normalize header keys: lowercase, remove non-alphanumeric except underscore
  const rawHeaders = rows[0];
  const headers = rawHeaders.map((h) =>
    h
      .toLowerCase()
      .replace(/[\s\-_]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  );

  const records: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = row[idx] !== undefined ? row[idx].trim() : '';
    });
    records.push(record);
  }

  return records;
}

/**
 * Returns a ready-to-use CSV template string with BOM and sample rows.
 */
export function getDeviceImportTemplateCSV(): string {
  const BOM = '\uFEFF';
  const headers = [
    'asset_number',
    'name',
    'model',
    'serial_number',
    'category',
    'manufacturer',
    'department',
    'location',
    'risk_classification',
    'criticality',
  ].join(',');

  const samples = [
    [
      'BEMMS-DEV-001',
      'Infusion Pump IV-300',
      'IV-3000',
      'SN-8492014',
      'Infusion Pump',
      'Baxter',
      'Emergency Department',
      'Room 102 - Trauma Bay',
      'class_iib',
      'high',
    ].join(','),
    [
      'BEMMS-DEV-002',
      'Patient Monitor IntelliVue',
      'MX450',
      'SN-9921443',
      'Patient Monitor',
      'Philips Healthcare',
      'Intensive Care Unit (ICU)',
      'Bed 04',
      'class_iib',
      'high',
    ].join(','),
    [
      'BEMMS-DEV-003',
      'Centrifuge 5424 R',
      '5424 R',
      'SN-1029481',
      'Laboratory Centrifuge',
      'Eppendorf',
      'Central Laboratory',
      'Bench 3',
      'class_i',
      'low',
    ].join(','),
  ].join('\n');

  return `${BOM}${headers}\n${samples}\n`;
}

/**
 * Returns a ready-to-use CSV template string with BOM and sample rows for departments.
 */
export function getDepartmentImportTemplateCSV(): string {
  const BOM = '\uFEFF';
  const headers = [
    'name',
    'code',
    'department_type',
    'hospital_name',
  ].join(',');

  const samples = [
    ['Emergency Department', 'ED', 'emergency', 'Central Teaching Hospital'].join(','),
    ['Intensive Care Unit', 'ICU', 'critical_care', 'Central Teaching Hospital'].join(','),
    ['Radiology Department', 'RAD', 'diagnostic', 'Central Teaching Hospital'].join(','),
  ].join('\n');

  return `${BOM}${headers}\n${samples}\n`;
}
