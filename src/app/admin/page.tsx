import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  // Use SECURITY DEFINER RPC to fetch all admin data (bypasses RLS)
  const { data: adminData, error } = await supabase.rpc("admin_fetch_all_data")

  const initialData = adminData || {
    articles: [],
    events: [],
    documents: [],
    users: [],
    tags: [],
    announcements: []
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">Platform Administration</h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage users, moderate content, and configure platform taxonomy.</p>
        {error && (
          <p className="text-red-500 text-sm mt-2">Data fetch error: {error.message}. Run the admin SQL functions first.</p>
        )}
      </div>

      <AdminDashboardClient initialData={initialData} />
    </div>
  )
}
