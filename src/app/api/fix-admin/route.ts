import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// One-time endpoint: visit /api/fix-admin while logged in as admin@isaa.com
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

  const ADMIN_USER_ID = "050c9626-1dff-4763-a37b-008569facc74"

  // Step 1: Call the SECURITY DEFINER function to bypass RLS
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc("promote_to_admin", { target_user_id: ADMIN_USER_ID })

  if (rpcError) {
    return NextResponse.json({
      success: false,
      step: "rpc_promote_to_admin",
      error: rpcError.message,
      hint: rpcError.hint || null,
      details: rpcError.details || null,
      code: rpcError.code || null,
    }, { status: 500 })
  }

  // Step 2: Verify the update worked
  const { data: user, error: verifyError } = await supabase
    .from("users")
    .select("id, display_name, role")
    .eq("id", ADMIN_USER_ID)
    .single()

  return NextResponse.json({
    success: true,
    rpcResult,
    verifiedUser: user,
    verifyError: verifyError?.message || null,
    message: user?.role === "admin"
      ? "✅ Admin role confirmed! Refresh your browser to see the Admin link."
      : "⚠️ RPC completed but role is still: " + user?.role + ". Check if the SQL function was created.",
  })
}
