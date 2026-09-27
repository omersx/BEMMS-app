export interface DefaultDepartmentTemplate {
  name: string;
  code: string;
  departmentType: string;
}

export const DEFAULT_HOSPITAL_DEPARTMENTS: DefaultDepartmentTemplate[] = [
  { name: 'Emergency Department', code: 'EMERG', departmentType: 'Emergency' },
  { name: 'Intensive Care Unit (ICU)', code: 'ICU', departmentType: 'Intensive Care' },
  { name: 'Surgery & Operating Theatre', code: 'SURG', departmentType: 'Surgical' },
  { name: 'Clinical Laboratory', code: 'LAB', departmentType: 'Laboratory' },
  { name: 'Radiology & Medical Imaging', code: 'RAD', departmentType: 'Diagnostic & Imaging' },
  { name: 'Pediatrics', code: 'PED', departmentType: 'Pediatrics' },
  { name: 'Dental Clinic', code: 'DENT', departmentType: 'Dental' },
];
