import { DefaultSession, User } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      fullName: string;
      organizationId: string | null;
      roles: string[];
      avatarUrl: string | null;
    } & DefaultSession["user"]
  }
  
  interface User {
    fullName: string;
    organizationId: string | null;
    accountStatus: string;
    avatarUrl: string | null;
  }
}

export type RoleCode = 
  | 'SYS_ADMIN' 
  | 'ORG_ADMIN' 
  | 'HOSP_ADMIN' 
  | 'BIOMED_MGR' 
  | 'BIOMED_ENG' 
  | 'BIOMED_TECH' 
  | 'DEPT_MGR' 
  | 'STAFF' 
  | 'AUDITOR';

export type PermissionModule = 
  | 'USERS'
  | 'ROLES'
  | 'DEVICES'
  | 'MAINTENANCE'
  | 'WORK_ORDERS'
  | 'SETTINGS';

export type PermissionAction = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  organizationId: string | null;
  roles: string[];
  avatarUrl: string | null;
}
