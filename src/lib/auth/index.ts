import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, userRoleAssignments, roles } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { eq, and, or } from 'drizzle-orm';
import { getLogger } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';

const log = getLogger('auth');

// ---------------------------------------------------------------------------
// In-memory rate limiter for login attempts (per identifier)
// ---------------------------------------------------------------------------
const LOGIN_MAX_ATTEMPTS = 5;           // max attempts before lockout
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, RateLimitEntry>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) return { allowed: true };

  // If currently locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  // If lock has expired, reset
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  // If window has expired, reset
  if (now - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  if (entry.attempts >= LOGIN_MAX_ATTEMPTS) {
    // Lock out for the remainder of the window
    entry.lockedUntil = entry.firstAttemptAt + LOGIN_WINDOW_MS;
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  return { allowed: true };
}

function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry || now - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(identifier, { attempts: 1, firstAttemptAt: now, lockedUntil: null });
    return;
  }

  entry.attempts += 1;

  if (entry.attempts >= LOGIN_MAX_ATTEMPTS) {
    entry.lockedUntil = entry.firstAttemptAt + LOGIN_WINDOW_MS;
    log.warn('Account temporarily locked due to excessive failed login attempts', {
      identifier,
      attempts: entry.attempts,
      lockedUntilMs: entry.lockedUntil,
    });
  }
}

function clearRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

// Periodically clean up expired entries to prevent memory leak (every 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts.entries()) {
    if (now - entry.firstAttemptAt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Sanitize login identifier — escape SQL LIKE pattern characters
// ---------------------------------------------------------------------------
function sanitizeLikeIdentifier(input: string): string {
  return input.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

// ---------------------------------------------------------------------------
// NextAuth configuration
// ---------------------------------------------------------------------------
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
  }) as any,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours — one hospital shift
  },
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
        const sanitized = sanitizeLikeIdentifier(identifier);

        // Check rate limit before doing any work
        const rateCheck = checkRateLimit(identifier.toLowerCase());
        if (!rateCheck.allowed) {
          log.warn('Login attempt blocked by rate limiter', {
            identifier,
            retryAfterMs: rateCheck.retryAfterMs,
          });
          return null;
        }

        let userResult;
        try {
          userResult = await db.query.users.findFirst({
            where: or(
              eq(users.email, sanitized),
              eq(users.email, `${sanitized}@bemms.local`),
              eq(users.employeeIdentifier, sanitized)
            ),
          });
        } catch (dbError: any) {
          log.error('Database connection error during login', dbError);
          throw new Error('DATABASE_CONNECTION_ERROR');
        }

        if (!userResult || !userResult.passwordHash) {
          log.warn('Failed login attempt', { identifier });
          recordFailedAttempt(identifier.toLowerCase());
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
          recordFailedAttempt(identifier.toLowerCase());
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
          recordFailedAttempt(identifier.toLowerCase());
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

        // Successful login — clear rate limit counter
        clearRateLimit(identifier.toLowerCase());

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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.fullName = (user as any).fullName;
        token.organizationId = (user as any).organizationId;
        token.avatarUrl = (user as any).avatarUrl;
        token.rolesLoadedAt = Date.now();
      }

      // Refresh roles from DB with a TTL of 5 minutes to reduce DB queries
      const ROLE_REFRESH_TTL_MS = 5 * 60 * 1000;
      const rolesLoadedAt = (token.rolesLoadedAt as number) || 0;
      const shouldRefreshRoles = trigger === 'signIn' || Date.now() - rolesLoadedAt > ROLE_REFRESH_TTL_MS;

      const userId = (token.id as string) || (token.sub as string) || (user?.id as string);
      if (userId && shouldRefreshRoles) {
        try {
          const assignments = await db
            .select({ code: roles.code })
            .from(userRoleAssignments)
            .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
            .where(and(
              eq(userRoleAssignments.userId, userId),
              eq(userRoleAssignments.status, 'active')
            ));

          token.roles = assignments.map((a: any) => a.code);
          token.rolesLoadedAt = Date.now();
        } catch (e) {
          log.error('Failed to load user roles in jwt callback', e);
          if (!token.roles) token.roles = [];
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
