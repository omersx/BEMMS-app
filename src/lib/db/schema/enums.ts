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

// Phase 4: Helpdesk Tickets enums
export const ticketStatusCodeEnum = pgEnum('ticket_status_code', [
  'new', 'acknowledged', 'in_triage', 'in_progress',
  'waiting_requester', 'waiting_parts_vendor',
  'resolved', 'closed', 'cancelled'
]);
export const ticketPriorityCodeEnum = pgEnum('ticket_priority_code', [
  'p1_critical', 'p2_high', 'p3_normal', 'p4_low'
]);
export const ticketTypeCodeEnum = pgEnum('ticket_type_code', [
  'device_problem', 'urgent_equipment_concern', 'maintenance_request',
  'inspection_request', 'calibration_request', 'pm_followup'
]);
export const ticketSourceEnum = pgEnum('ticket_source', [
  'qr_scan', 'department_device_selection', 'device_profile', 'manual_entry', 'import'
]);
export const reportedImpactCodeEnum = pgEnum('reported_impact_code', [
  'device_usable', 'device_not_usable', 'patient_care_affected'
]);
export const reporterProblemCategoryCodeEnum = pgEnum('reporter_problem_category_code', [
  'power_issue', 'device_not_starting', 'display_interface', 'alarm_problem',
  'sensor_accessory', 'electrical_concern', 'mechanical_damage',
  'software_configuration', 'performance_concern', 'maintenance_request', 'other'
]);
export const maintenanceTypeCodeEnum = pgEnum('maintenance_type_code', [
  'preventive_maintenance', 'corrective_maintenance', 'troubleshooting',
  'inspection', 'calibration', 'electrical_safety_testing',
  'performance_testing', 'installation_commissioning',
  'software_configuration', 'decommissioning'
]);
export const technicalProblemCategoryCodeEnum = pgEnum('technical_problem_category_code', [
  'electrical_power', 'display_user_interface', 'alarm_safety',
  'sensor_measurement', 'mechanical', 'software_configuration',
  'performance_output', 'accessory_consumable', 'physical_damage',
  'communication_network', 'no_fault_found', 'other'
]);
export const ticketCommentVisibilityEnum = pgEnum('ticket_comment_visibility', [
  'public', 'internal', 'restricted'
]);
export const ticketEventTypeEnum = pgEnum('ticket_event_type', [
  'created', 'acknowledged', 'triaged', 'assigned', 'reassigned',
  'accepted', 'status_changed', 'priority_changed', 'waiting_for_info',
  'info_received', 'maintenance_task_linked', 'resolved', 'closed',
  'cancelled', 'reopened'
]);

// Phase 5: Maintenance enums
export const maintenanceTaskStatusCodeEnum = pgEnum('maintenance_task_status_code', [
  'draft', 'assigned', 'in_progress', 'waiting_dependency',
  'work_complete', 'awaiting_review', 'returned_for_rework',
  'awaiting_release', 'closed', 'cancelled'
]);
export const maintenancePlanStatusEnum = pgEnum('maintenance_plan_status', [
  'active', 'paused', 'archived'
]);
export const pmCalculationMethodEnum = pgEnum('pm_calculation_method', [
  'fixed_calendar', 'completion_based'
]);
export const occurrenceDueStateEnum = pgEnum('occurrence_due_state', [
  'scheduled', 'due_soon', 'due_today', 'overdue', 'completed', 'deferred', 'cancelled'
]);
export const checklistResultCodeEnum = pgEnum('checklist_result_code', [
  'passed', 'failed', 'not_applicable', 'requires_follow_up'
]);
export const maintenanceFinalResultCodeEnum = pgEnum('maintenance_final_result_code', [
  'passed', 'passed_with_limitations', 'failed', 'no_fault_found',
  'decommission_recommended', 'requires_external_service'
]);
export const signaturePurposeEnum = pgEnum('signature_purpose', [
  'accept', 'perform', 'review', 'approve', 'release',
  'resolve', 'close', 'reject', 'amend', 'void'
]);
export const signatureAuthMethodEnum = pgEnum('signature_auth_method', [
  'password_reauth', 'signing_pin', 'passkey', 'session_challenge'
]);
export const signatureStatusEnum = pgEnum('signature_status', [
  'active', 'superseded', 'rejected', 'voided'
]);
export const costTypeEnum = pgEnum('cost_type', [
  'part', 'vendor_service', 'labor', 'transport', 'other'
]);
export const recordVersionEntityTypeEnum = pgEnum('record_version_entity_type', [
  'maintenance_record', 'device_status_change', 'calibration_record',
  'test_record', 'ticket_resolution'
]);
