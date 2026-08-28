import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, userRoleAssignments, roles } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
  }) as any,
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const userResult = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!userResult || !userResult.passwordHash) {
          return null;
        }
        
        if (userResult.accountStatus !== 'active') {
          return null;
        }

        const isPasswordValid = await verifyPassword(credentials.password as string, userResult.passwordHash);

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
    async session({ session, user, token }) {
      if (session.user) {
        let userId = user?.id;
        
        if (!userId && token?.sub) {
            userId = token.sub;
        }

        if (userId) {
          const assignments = await db
            .select({ code: roles.code })
            .from(userRoleAssignments)
            .innerJoin(roles, eq(userRoleAssignments.roleId, roles.id))
            .where(eq(userRoleAssignments.userId, userId));
            
          session.user.id = userId;
          session.user.roles = assignments.map((a: any) => a.code);
          
          if (user) {
            session.user.fullName = user.fullName;
            session.user.organizationId = user.organizationId;
            session.user.avatarUrl = user.avatarUrl;
          }
        }
      }
      return session;
    },
  },
});
