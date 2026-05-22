import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Setup from middleware handles sets
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // Setup from middleware handles removes
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Verify Admin Role securely from the users table
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (!userProfile || userProfile.role !== "admin") {
    redirect("/") // Redirect regular users to homepage
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50">
      <div className="container mx-auto py-10 px-4 md:px-8 max-w-[1400px]">
        {children}
      </div>
    </div>
  )
}
