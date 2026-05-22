import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { ForumPageClient } from "@/components/forum/forum-page-client"
import type { ForumArticleCard } from "@/components/forum/types"

export default async function ForumPage() {
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

  const { data } = await supabase
    .from("articles")
    .select(`
      id,
      title,
      abstract,
      created_at,
      subject_tags,
      school_tags,
      author:users(id, display_name, avatar_url, school),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .order("created_at", { ascending: false })

  return <ForumPageClient initialArticles={(data as unknown as ForumArticleCard[]) || []} />
}
