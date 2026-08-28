import { redirect } from 'next/navigation'
// import { getServerSession } from 'next-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = { name: 'Dr. Smith', role: 'Admin', email: 'smith@hospital.org' }

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        <Header user={user} />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}