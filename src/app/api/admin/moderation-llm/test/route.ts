import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { callModerationLlm, normalizeResponsesUrl } from "@/lib/moderation"

async function getAdminError() {
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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (error || user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}

function shortErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error"
  return message.length > 500 ? `${message.slice(0, 500)}...` : message
}

export async function POST(request: NextRequest) {
  const adminError = await getAdminError()
  if (adminError) return adminError

  const body = await request.json()
  const baseUrl = String(body.baseUrl || "").trim()
  const model = String(body.model || "").trim()
  const prompt = String(body.prompt || "").trim()
  const apiKey = String(body.apiKey || "").trim()

  if (!baseUrl || !model || !prompt) {
    return NextResponse.json({ error: "Base URL, model, and prompt are required." }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: "Paste an API key to test the current unsaved settings." }, { status: 400 })
  }

  try {
    const result = await callModerationLlm(
      {
        enabled: true,
        baseUrl: normalizeResponsesUrl(baseUrl),
        apiKey,
        model,
        prompt,
      },
      {
        title: "Test academic discussion",
        abstract: "A short proposal about organizing a student research reading group.",
        content: "We want to discuss methods, sources, and feedback for a high school research project.",
      }
    )

    return NextResponse.json({
      ok: true,
      status: result.status,
      reason: result.reason,
      score: result.score,
    })
  } catch (error) {
    return NextResponse.json({ error: shortErrorMessage(error) }, { status: 400 })
  }
}
