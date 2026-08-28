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
