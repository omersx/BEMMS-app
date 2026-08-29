import { pgEnum } from 'drizzle-orm/pg-core';

export const organizationStatusEnum = pgEnum('organization_status', ['active', 'archived']);
export const hospitalStatusEnum = pgEnum('hospital_status', ['active', 'inactive', 'archived']);
export const departmentStatusEnum = pgEnum('department_status', ['active', 'inactive', 'archived']);
export const locationTypeEnum = pgEnum('location_type', ['building', 'floor', 'room', 'area', 'workshop', 'store', 'other']);
export const locationStatusEnum = pgEnum('location_status', ['active', 'inactive', 'archived']);
export const userAccountStatusEnum = pgEnum('user_account_status', ['invited', 'active', 'suspended', 'deactivated', 'archived']);
export const roleStatusEnum = pgEnum('role_status', ['active', 'inactive', 'archived']);
export const scopeTypeEnum = pgEnum('scope_type', ['organization', 'hospital', 'department', 'location', 'assigned_work', 'category']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['active', 'revoked', 'expired']);
export const permissionModuleEnum = pgEnum('permission_module', ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'SIGNATURES', 'REPORTS', 'ADMIN', 'AUDIT']);
export const permissionActionEnum = pgEnum('permission_action', ['VIEW', 'CREATE', 'EDIT', 'ASSIGN', 'APPROVE', 'SIGN', 'RELEASE', 'ARCHIVE', 'EXPORT', 'MANAGE_POLICY']);
export const auditActionTypeEnum = pgEnum('audit_action_type', ['CREATE', 'UPDATE', 'DEACTIVATE', 'ARCHIVE', 'TRANSFER', 'PURGE', 'SIGN', 'POLICY_CHANGE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN']);

// Phase 3: Device Management enums
export const riskClassificationEnum = pgEnum('risk_classification', ['class_i', 'class_iia', 'class_iib', 'class_iii']);
export const criticalityLevelEnum = pgEnum('criticality_level', ['critical', 'high', 'medium', 'low']);
export const deviceStatusCodeEnum = pgEnum('device_status_code', [
  'operational', 'operational_with_limitations', 'under_maintenance', 'under_repair',
  'waiting_for_parts', 'awaiting_release', 'out_of_service', 'standby', 'decommissioned'
]);
export const deviceLifecycleStatusEnum = pgEnum('device_lifecycle_status', ['active', 'decommissioned', 'archived']);
export const qrLabelStatusEnum = pgEnum('qr_label_status', ['active', 'replaced', 'revoked']);
export const deviceDocumentCategoryEnum = pgEnum('device_document_category', [
  'user_manual', 'service_manual', 'calibration_certificate', 'warranty_doc',
  'photo', 'inspection_report', 'other'
]);
export const documentVisibilityEnum = pgEnum('document_visibility', ['public_department', 'biomedical_only', 'admin_only']);
export const transferReasonEnum = pgEnum('transfer_reason', [
  'relocation', 'temporary_loan', 'department_change', 'correction',
  'replacement', 'workshop', 'storage', 'other'
]);
export const refDataStatusEnum = pgEnum('ref_data_status', ['active', 'archived']);
