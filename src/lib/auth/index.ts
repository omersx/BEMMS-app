import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, userRoleAssignments, roles } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { eq, or } from 'drizzle-orm';

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
              eq(users.email, identifier),
              eq(users.email, `${identifier}@bemms.local`),
              eq(users.employeeIdentifier, identifier)
            ),
          });
        } catch (dbError: any) {
          console.error('[Auth] Database connection error during login:', dbError.message);
          throw new Error('DATABASE_CONNECTION_ERROR');
        }

        if (!userResult || !userResult.passwordHash) {
          return null;
        }

        if (userResult.accountStatus !== 'active') {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password as string,
          userResult.passwordHash
        );

        if (!isPasswordValid) {
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
          console.error('[Auth] Failed to load user roles:', e);
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
