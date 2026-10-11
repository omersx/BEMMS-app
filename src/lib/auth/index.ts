import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, userRoleAssignments, roles } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { eq, or, ilike } from 'drizzle-orm';
import { getLogger } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';

const log = getLogger('auth');

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
  }) as any,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const identifier = (credentials.email as string).trim();

        let userResult;
        try {
          userResult = await db.query.users.findFirst({
            where: or(
              ilike(users.email, identifier),
              ilike(users.email, `${identifier}@bemms.local`),
              ilike(users.employeeIdentifier, identifier)
            ),
          });
        } catch (dbError: any) {
          log.error('Database connection error during login', dbError);
          throw new Error('DATABASE_CONNECTION_ERROR');
        }

        if (!userResult || !userResult.passwordHash) {
          log.warn('Failed login attempt', { identifier });
          try {
            await createAuditLog({
              entityType: 'user_session',
              entityId: identifier,
              actionType: 'FAILED_LOGIN',
              newState: {
                attemptedIdentifier: identifier,
                reason: 'user_not_found',
                attemptedAt: new Date().toISOString(),
              },
            });
          } catch (auditErr) {
            log.error('Failed to create failed-login audit log', auditErr);
          }
          return null;
        }

        if (userResult.accountStatus !== 'active') {
          log.warn('Failed login attempt', { identifier });
          try {
            await createAuditLog({
              actorUserId: userResult.id,
              organizationId: userResult.organizationId,
              entityType: 'user_session',
              entityId: userResult.id,
              actionType: 'FAILED_LOGIN',
              newState: {
                attemptedIdentifier: identifier,
                reason: 'account_inactive',
                attemptedAt: new Date().toISOString(),
              },
            });
          } catch (auditErr) {
            log.error('Failed to create failed-login audit log', auditErr);
          }
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password as string,
          userResult.passwordHash
        );

        if (!isPasswordValid) {
          log.warn('Failed login attempt', { identifier });
          try {
            await createAuditLog({
              actorUserId: userResult.id,
              organizationId: userResult.organizationId,
              entityType: 'user_session',
              entityId: userResult.id,
              actionType: 'FAILED_LOGIN',
              newState: {
                attemptedIdentifier: identifier,
                reason: 'invalid_credentials',
                attemptedAt: new Date().toISOString(),
              },
            });
          } catch (auditErr) {
            log.error('Failed to create failed-login audit log', auditErr);
          }
          return null;
        }

        return {
          id: userResult.id,
          email: userResult.email,
          fullName: userResult.fullName,
          organizationId: userResult.organizationId,
          accountStatus: userResult.accountStatus,
          avatarUrl: userResult.avatarUrl,
        };
      },
    }),
  ],
  events: {
    async signIn({ user, account }) {
      // Log successful login
      log.info('User signed in', { userId: user.id, email: user.email });

      // Create audit log entry for LOGIN
      try {
        await createAuditLog({
          actorUserId: user.id,
          organizationId: (user as any).organizationId || null,
          entityType: 'user_session',
          entityId: user.id || 'unknown',
          actionType: 'LOGIN',
          newState: {
            email: user.email,
            fullName: (user as any).fullName,
            loginAt: new Date().toISOString(),
            provider: account?.provider || 'credentials',
          },
        });
      } catch (err) {
        log.error('Failed to create login audit log', err);
      }

      // Update lastLoginAt on the user record
      try {
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id as string));
      } catch (err) {
        log.error('Failed to update lastLoginAt', err);
      }
    },
    async signOut({ token }: any) {
      // Log sign out
      const userId = (token as any)?.id || (token as any)?.sub;
      log.info('User signed out', { userId });

      try {
        await createAuditLog({
          actorUserId: userId || null,
          entityType: 'user_session',
          entityId: userId || 'unknown',
          actionType: 'LOGOUT',
          newState: {
            logoutAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        log.error('Failed to create logout audit log', err);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.fullName = (user as any).fullName;
        token.organizationId = (user as any).organizationId;
        token.avatarUrl = (user as any).avatarUrl;

        try {
          const assignments = await db
            .select({ code: roles.code })
            .from(userRoleAssignments)
            .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
            .where(eq(userRoleAssignments.userId, user.id as string));

          token.roles = assignments.map((a: any) => a.code);
        } catch (e) {
          log.error('Failed to load user roles', e);
          token.roles = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.fullName = token.fullName as string;
        session.user.organizationId = token.organizationId as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.roles = (token.roles as string[]) || [];
      }
      return session;
    },
  },
});

