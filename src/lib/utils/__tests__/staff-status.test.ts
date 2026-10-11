import { describe, it, expect } from 'vitest';
import { getStaffStatus, getStaffStatusStyle, isStaffOnly } from '@/lib/utils/staff-status';

describe('Staff Status Translations', () => {
  it('translates internal status codes to patient/clinical-friendly labels', () => {
    expect(getStaffStatus('new').label).toBe('Submitted');
    expect(getStaffStatus('acknowledged').label).toBe('Reviewed');
    expect(getStaffStatus('in_triage').label).toBe('Being reviewed');
    expect(getStaffStatus('assigned').label).toBe('Assigned to Engineering');
    expect(getStaffStatus('in_progress').label).toBe('Being repaired');
    expect(getStaffStatus('waiting_parts_vendor').label).toBe('Waiting for parts');
    expect(getStaffStatus('waiting_requester').label).toBe('Response requested');
    expect(getStaffStatus('resolved').label).toBe('Resolved');
    expect(getStaffStatus('closed').label).toBe('Closed');
    expect(getStaffStatus('reopened').label).toBe('Reopened');
  });

  it('provides sensible fallback for unknown status codes', () => {
    const unknown = getStaffStatus('custom_status_code');
    expect(unknown.label).toBe('custom status code');
    expect(unknown.color).toBe('gray');
  });

  it('provides theme styles for status colors', () => {
    const inProgressStyle = getStaffStatusStyle('in_progress');
    expect(inProgressStyle.bg).toContain('amber');

    const resolvedStyle = getStaffStatusStyle('resolved');
    expect(resolvedStyle.bg).toContain('green');

    const waitingRequesterStyle = getStaffStatusStyle('waiting_requester');
    expect(waitingRequesterStyle.bg).toContain('red');
  });

  it('correctly identifies staff-only roles without biomedical or admin privileges', () => {
    expect(isStaffOnly(['STAFF'])).toBe(true);
    expect(isStaffOnly(['DEPT_MGR'])).toBe(true);
    expect(isStaffOnly(['STAFF', 'DEPT_MGR'])).toBe(true);

    // Elevated roles must NOT be staff-only
    expect(isStaffOnly(['STAFF', 'BIOMED_ENG'])).toBe(false);
    expect(isStaffOnly(['STAFF', 'BIOMED_TECH'])).toBe(false);
    expect(isStaffOnly(['STAFF', 'BIOMED_MGR'])).toBe(false);
    expect(isStaffOnly(['STAFF', 'SYS_ADMIN'])).toBe(false);
    expect(isStaffOnly(['ORG_ADMIN'])).toBe(false);
    expect(isStaffOnly(['HOSP_ADMIN'])).toBe(false);
    expect(isStaffOnly(['BIOMED_ENG'])).toBe(false);
    expect(isStaffOnly([])).toBe(false);
  });
});
