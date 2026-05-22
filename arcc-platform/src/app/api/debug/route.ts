import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Diagnostic endpoint to find what's blocking the admin role update
export async function GET() {
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

  // Check triggers on users table
  const { data: triggers, error: trigErr } = await supabase
    .rpc("diagnose_users_table")

  return NextResponse.json({
    triggers,
    trigErr: trigErr ? { message: trigErr.message, hint: trigErr.hint, code: trigErr.code } : null,
  })
}
