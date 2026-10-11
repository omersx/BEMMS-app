/**
 * Staff-facing plain-language status translations.
 * Department staff (doctors/nurses) see these instead of internal codes.
 */

export interface StaffStatusInfo {
  label: string;
  color: 'blue' | 'indigo' | 'amber' | 'red' | 'green' | 'gray';
  icon: string; // emoji
  description: string;
}

const STAFF_STATUS_MAP: Record<string, StaffStatusInfo> = {
  new: {
    label: 'Submitted',
    color: 'blue',
    icon: '📝',
    description: 'Your report has been submitted to Biomedical Engineering.',
  },
  acknowledged: {
    label: 'Reviewed',
    color: 'blue',
    icon: '✓',
    description: 'Your report has been reviewed by the biomedical team.',
  },
  in_triage: {
    label: 'Being reviewed',
    color: 'blue',
    icon: '🔍',
    description: 'The biomedical team is reviewing your report.',
  },
  assigned: {
    label: 'Assigned to Engineering',
    color: 'indigo',
    icon: '👤',
    description: 'An engineer has been assigned to work on this.',
  },
  in_progress: {
    label: 'Being repaired',
    color: 'amber',
    icon: '🔧',
    description: 'The engineer is actively working on this device.',
  },
  waiting_parts_vendor: {
    label: 'Waiting for parts',
    color: 'amber',
    icon: '📦',
    description: 'Repair is paused until replacement parts arrive.',
  },
  waiting_requester: {
    label: 'Response requested',
    color: 'red',
    icon: '💬',
    description: 'The biomedical team needs more information from you.',
  },
  resolved: {
    label: 'Resolved',
    color: 'green',
    icon: '✅',
    description: 'The issue has been fixed.',
  },
  closed: {
    label: 'Closed',
    color: 'gray',
    icon: '✓',
    description: 'This ticket is closed.',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    icon: '—',
    description: 'This ticket was cancelled.',
  },
  reopened: {
    label: 'Reopened',
    color: 'amber',
    icon: '🔄',
    description: 'This ticket has been reopened — work resumed.',
  },
};

export function getStaffStatus(statusCode: string): StaffStatusInfo {
  return STAFF_STATUS_MAP[statusCode] || {
    label: statusCode.replace(/_/g, ' '),
    color: 'gray' as const,
    icon: '•',
    description: '',
  };
}

const STAFF_STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-800' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-950', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-200 dark:border-indigo-800' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-200 dark:border-amber-800' },
  red: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-800' },
  green: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-800 dark:text-green-200', border: 'border-green-200 dark:border-green-800' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800' },
};

export function getStaffStatusStyle(statusCode: string) {
  const info = getStaffStatus(statusCode);
  return STAFF_STATUS_STYLES[info.color] || STAFF_STATUS_STYLES.gray;
}

/**
 * Check if the given roles array represents a department staff user
 * (STAFF or DEPT_MGR without any BME or admin roles).
 */
export function isStaffOnly(roles: string[]): boolean {
  const staffRoles = ['STAFF', 'DEPT_MGR'];
  const elevatedRoles = ['SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH', 'AUDITOR'];
  const hasStaff = roles.some(r => staffRoles.includes(r));
  const hasElevated = roles.some(r => elevatedRoles.includes(r));
  return hasStaff && !hasElevated;
}
