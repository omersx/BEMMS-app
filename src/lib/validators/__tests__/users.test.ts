import { describe, it, expect } from 'vitest';
import { updateUserProfileSchema, inviteUserSchema } from '../users';

describe('updateUserProfileSchema', () => {
  it('validates profile updates with valid clinical title and phone', () => {
    const result = updateUserProfileSchema.safeParse({
      fullName: 'Dr. Sarah Al-Mansoor',
      jobTitle: 'Charge Nurse - Intensive Care Unit',
      phone: '+966 50 123 4567',
      employeeIdentifier: 'Ext. 3120 - Bed 4',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial updates', () => {
    const result = updateUserProfileSchema.safeParse({
      phone: '+966 55 987 6543',
    });
    expect(result.success).toBe(true);
  });

  it('rejects fullName that is too short', () => {
    const result = updateUserProfileSchema.safeParse({
      fullName: 'A',
    });
    expect(result.success).toBe(false);
  });
});

describe('inviteUserSchema', () => {
  it('validates user invitation payload with required fields', () => {
    const result = inviteUserSchema.safeParse({
      fullName: 'Nurse Layla',
      email: 'layla@hospital.org',
      jobTitle: 'Staff Nurse',
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      roleIds: ['123e4567-e89b-12d3-a456-426614174001'],
    });
    expect(result.success).toBe(true);
  });

  it('validates user invitation payload with optional hospital, department and specialization', () => {
    const result = inviteUserSchema.safeParse({
      fullName: 'Eng. Khalid Al-Otaibi',
      email: 'khalid@hospital.org',
      jobTitle: 'Senior Biomedical Engineer',
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      roleIds: ['123e4567-e89b-12d3-a456-426614174001'],
      hospitalId: '123e4567-e89b-12d3-a456-426614174002',
      departmentId: '123e4567-e89b-12d3-a456-426614174003',
      specialization: 'ICU & Ventilators',
    });
    expect(result.success).toBe(true);
  });

  it('validates addUser with initial password and dutyStatus', () => {
    const result = inviteUserSchema.safeParse({
      fullName: 'Eng. Omar',
      email: 'omar@hospital.org',
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      roleIds: ['123e4567-e89b-12d3-a456-426614174001'],
      password: 'SecurePassword123!',
      dutyStatus: 'on_duty',
    });
    expect(result.success).toBe(true);
  });

  it('validates addUser with explicit username', () => {
    const result = inviteUserSchema.safeParse({
      fullName: 'Eng. Omar',
      email: 'omar@hospital.org',
      username: 'eng.omar',
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      roleIds: ['123e4567-e89b-12d3-a456-426614174001'],
      password: 'SecurePassword123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 6 characters if provided', () => {
    const result = inviteUserSchema.safeParse({
      fullName: 'Eng. Omar',
      email: 'omar@hospital.org',
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      roleIds: ['123e4567-e89b-12d3-a456-426614174001'],
      password: '123',
    });
    expect(result.success).toBe(false);
  });
});


