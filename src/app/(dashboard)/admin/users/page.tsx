import { Suspense } from "react"
import { getUsers } from "@/lib/actions/users"
import { UsersPageClient } from "@/components/admin/users-page-client"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const result = await getUsers()
  const users = result?.success && result.data ? (result.data as any[]) : []

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <UsersPageClient users={users} />
    </Suspense>
  )
}
