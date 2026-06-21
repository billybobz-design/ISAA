"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { revalidatePath } from "next/cache"

import { createServiceSupabaseClient } from "@/lib/admin-supabase"

// Helper to get authenticated server client and verify admin role
async function getAdminSupabase() {
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
  if (!session) throw new Error("Unauthorized")

  // Explicit server-side role verification
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: Admin access required.")
  }

  return supabase
}

// ===== All admin operations use SECURITY DEFINER RPC functions to bypass RLS =====

// 1. Delete content (articles, events, documents, comments)
export async function deleteUserActivity(table: string, id: string) {
  const supabase = await getAdminSupabase()

  if (!["articles", "events", "documents", "comments"].includes(table)) {
    throw new Error("Invalid table.")
  }

  const { error } = await supabase
    .rpc("admin_delete_record", { target_table: table, target_id: id })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}

// 2. Delete a user account permanently
export async function deleteUser(userId: string) {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .rpc("admin_delete_user", { target_user_id: userId })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}


// 5. Create an announcement (no author_id — column doesn't exist)
export async function createAnnouncement(title: string, content: string) {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .rpc("admin_create_announcement", { ann_title: title, ann_content: content })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
  revalidatePath("/")
}

// 6. Delete an announcement
export async function deleteAnnouncement(id: string) {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .rpc("admin_delete_announcement", { target_id: id })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
  revalidatePath("/")
}

// 7. Toggle announcement active status
export async function toggleAnnouncement(id: string, isActive: boolean) {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .rpc("admin_toggle_announcement", { target_id: id, new_status: isActive })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
  revalidatePath("/")
}

export async function reviewArticle(id: string, status: "approved" | "rejected" | "pending", note?: string) {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .rpc("admin_review_article", { target_article_id: id, new_status: status, note: note || null })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
  revalidatePath("/forum")
}

export async function setArticlePinned(id: string, pinned: boolean) {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .rpc("admin_set_article_pinned", { target_article_id: id, pinned })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
  revalidatePath("/forum")
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  const supabase = await getAdminSupabase()

  const { error } = await supabase
    .rpc("admin_set_user_role", { target_user_id: userId, new_role: role })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}

export async function updateModerationLlmSettings(settings: {
  enabled: boolean
  baseUrl: string
  apiKey?: string
  clearApiKey?: boolean
  model: string
  prompt: string
}) {
  const supabase = await getAdminSupabase()

  const { error } = await supabase.rpc("admin_update_moderation_llm_settings", {
    p_enabled: settings.enabled,
    p_base_url: settings.baseUrl,
    p_api_key: settings.apiKey?.trim() || null,
    p_clear_api_key: Boolean(settings.clearApiKey),
    p_model: settings.model,
    p_prompt: settings.prompt,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/admin")
}

// 8. Fetch all admin data (bypasses RLS via SECURITY DEFINER)
export async function fetchAdminData() {
  const supabase = await getAdminSupabase()

  const { data, error } = await supabase.rpc("admin_fetch_all_data")

  if (error) throw new Error(error.message)

  // Safety net: rebuild the Review Queue ourselves so it surfaces every post
  // awaiting moderation, regardless of how the DB ended up labelling it. This
  // covers older articles that pre-date the moderation migration and were
  // force-rejected by the now-removed keyword trigger.
  const serviceSupabase = createServiceSupabaseClient()
  if (serviceSupabase) {
    const { data: queue, error: queueError } = await serviceSupabase
      .from("articles")
      .select(
        "id, title, abstract, status, moderation_reason, moderation_score, moderation_source, created_at, author:users!articles_author_id_fkey(display_name, school)"
      )
      .in("status", ["pending", "rejected"])
      .order("created_at", { ascending: false })

    if (!queueError) {
      const filtered = (queue || []).filter((article) => {
        if (article.status === "pending") return true
        // Hide articles an admin already explicitly rejected.
        const reason = (article.moderation_reason || "").toLowerCase()
        return !reason.startsWith("rejected by admin")
      })
      return { ...(data as object), pending_articles: filtered }
    }
  }

  return data
}
