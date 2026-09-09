import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, changePasswordSchema, passwordResetSchema } from '../auth';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email address');
    }
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('requires fullName with min 2 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'J',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional phone and jobTitle', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John Doe',
      phone: '+1234567890',
      jobTitle: 'Engineer',
    });
    expect(result.success).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid password with all requirements', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldPassword',
      newPassword: 'NewP@ss1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldPassword',
      newPassword: 'newp@ss1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldPassword',
      newPassword: 'NEWP@SS1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldPassword',
      newPassword: 'NewP@ssw',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without special character', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldPassword',
      newPassword: 'NewPass1s',
    });
    expect(result.success).toBe(false);
  });
});

describe('passwordResetSchema', () => {
  it('accepts valid email', () => {
    const result = passwordResetSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = passwordResetSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });
});
