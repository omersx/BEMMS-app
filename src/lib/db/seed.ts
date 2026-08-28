import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('Starting seed...');

  try {
    // 1. Create Default Organization
    const [org] = await db.insert(schema.organizations).values({
      name: 'Default Organization',
      code: 'DEFAULT',
      defaultTimezone: 'UTC',
    }).onConflictDoNothing().returning();

    let orgId = org?.id;
    if (!orgId) {
      const existingOrg = await db.query.organizations.findFirst({
        where: (organizations, { eq }) => eq(organizations.code, 'DEFAULT'),
      });
      orgId = existingOrg!.id;
    }

    // 2. Create System Roles
    const systemRoles = [
      { code: 'SYS_ADMIN', name: 'System Administrator', isSystemRole: true },
      { code: 'ORG_ADMIN', name: 'Organization Administrator', isSystemRole: true },
      { code: 'HOSP_ADMIN', name: 'Hospital Administrator', isSystemRole: true },
      { code: 'BIOMED_MGR', name: 'Biomedical Manager', isSystemRole: true },
      { code: 'BIOMED_ENG', name: 'Biomedical Engineer', isSystemRole: true },
      { code: 'BIOMED_TECH', name: 'Biomedical Technician', isSystemRole: true },
      { code: 'DEPT_MGR', name: 'Department Manager', isSystemRole: true },
      { code: 'STAFF', name: 'Staff', isSystemRole: true },
      { code: 'AUDITOR', name: 'Auditor', isSystemRole: true },
    ];

    for (const role of systemRoles) {
      await db.insert(schema.roles).values({
        organizationId: orgId,
        ...role,
      }).onConflictDoNothing();
    }

    const sysAdminRole = await db.query.roles.findFirst({
      where: (roles, { eq }) => eq(roles.code, 'SYS_ADMIN'),
    });

    if (!sysAdminRole) {
      throw new Error('SYS_ADMIN role not found after insert');
    }

    // 3. Create all permissions
    const modules = ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'SIGNATURES', 'REPORTS', 'ADMIN', 'AUDIT'];
    const actions = ['VIEW', 'CREATE', 'EDIT', 'ASSIGN', 'APPROVE', 'SIGN', 'RELEASE', 'ARCHIVE', 'EXPORT', 'MANAGE_POLICY'];

    for (const mod of modules) {
      for (const act of actions) {
        await db.insert(schema.permissions).values({
          module: mod as any, // Cast if type mismatch occurs
          action: act as any,
        }).onConflictDoNothing();
      }
    }

    // 4. Assign all permissions to SYS_ADMIN
    const allPermissions = await db.query.permissions.findMany();
    for (const permission of allPermissions) {
      await db.insert(schema.rolePermissions).values({
        roleId: sysAdminRole.id,
        permissionId: permission.id,
      }).onConflictDoNothing();
    }

    // 5. Create Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bemms.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const [adminUser] = await db.insert(schema.users).values({
      email: adminEmail,
      passwordHash,
      fullName: 'System Administrator',
      organizationId: orgId,
      accountStatus: 'active',
    }).onConflictDoNothing().returning();

    let adminId = adminUser?.id;
    if (!adminId) {
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, adminEmail),
      });
      adminId = existingUser!.id;
    }

    // 6. Assign SYS_ADMIN role to admin user
    await db.insert(schema.userRoleAssignments).values({
      userId: adminId,
      roleId: sysAdminRole.id,
      organizationId: orgId,
    }).onConflictDoNothing();

    // 7. Create User Access Scope for Admin User
    await db.insert(schema.userAccessScopes).values({
      userId: adminId,
      organizationId: orgId,
      scopeType: 'organization',
    }).onConflictDoNothing();

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
