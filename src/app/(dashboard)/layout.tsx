import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const sessionUser = session?.user as
    | { name?: string; fullName?: string; email?: string; roles?: string[] }
    | undefined;

  const user = {
    name: sessionUser?.fullName || sessionUser?.name || 'Administrator',
    role: sessionUser?.roles?.[0] ? sessionUser.roles[0].replace(/_/g, ' ') : 'Admin',
    email: sessionUser?.email || 'admin@hospital.org',
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        <Header user={user} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}