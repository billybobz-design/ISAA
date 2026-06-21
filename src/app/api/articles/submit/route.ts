import { NextResponse } from "next/server"

import { moderateAcademicPost } from "@/lib/moderation"
import { createServerSupabaseClient } from "@/lib/server-supabase"

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, 12)
    )
  )
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const title = String(body.title || "").trim()
  const abstract = String(body.abstract || "").trim()
  const content = String(body.content || "").trim()

  if (!title || !abstract || !content) {
    return NextResponse.json({ error: "Title, abstract, and content are required." }, { status: 400 })
  }

  const { data: keywordMatches, error: keywordError } = await supabase.rpc("match_moderation_keywords", {
    input_text: `${title}\n${abstract}\n${content}`,
  })

  if (keywordError) {
    return NextResponse.json({ error: keywordError.message }, { status: 400 })
  }

  const keywordHit = Array.isArray(keywordMatches) && keywordMatches.length > 0
    ? {
        pattern: String(keywordMatches[0].pattern),
      }
    : null

  const moderation = await moderateAcademicPost({ title, abstract, content, keywordHit })

  // Belt-and-braces: only an admin can mark a post as rejected. Any automated
  // path that still returns "rejected" gets coerced to "pending" here.
  if (moderation.status === "rejected") {
    moderation.status = "pending"
  }

  const { data: articleId, error } = await supabase.rpc("submit_article_for_review", {
    p_title: title,
    p_abstract: abstract,
    p_content: content,
    p_subject_tags: cleanTags(body.subjectTags),
    p_school_tags: cleanTags(body.schoolTags),
    p_llm_status: moderation.status,
    p_llm_reason: moderation.reason,
    p_llm_score: moderation.score,
    p_moderation_source: moderation.source,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    id: articleId,
    status: moderation.status,
    reason: moderation.reason,
    score: moderation.score,
    source: moderation.source,
  })
}
