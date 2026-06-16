import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

const MAX_KEYWORDS = 120_000
const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_PATTERN_LENGTH = 120

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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { supabase, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (error || user?.role !== "admin") {
    return { supabase, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, error: null }
}

function parseKeywordText(text: string) {
  const seen = new Set<string>()

  for (const rawLine of text.split(/\r?\n/)) {
    const pattern = rawLine.trim()

    if (!pattern || pattern.startsWith("#")) continue
    if (pattern.length > MAX_PATTERN_LENGTH) {
      throw new Error(`Keyword is too long: ${pattern.slice(0, 24)}`)
    }

    seen.add(pattern)
    if (seen.size > MAX_KEYWORDS) {
      throw new Error(`Keyword list exceeds ${MAX_KEYWORDS} lines.`)
    }
  }

  return Array.from(seen)
}

export async function GET(request: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const listId = searchParams.get("listId")

  const { data, error: keywordsError } = await supabase.rpc("admin_get_moderation_keyword_file", {
    target_list_id: listId || null,
  })

  if (keywordsError) {
    return NextResponse.json({ error: keywordsError.message }, { status: 400 })
  }

  const patterns = Array.isArray(data?.patterns) ? data.patterns : []
  const fileName = sanitizeDownloadFileName(String(data?.file_name || "moderation-keywords.txt"))
  const body = `${patterns.join("\n")}\n`

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  })
}

function sanitizeDownloadFileName(fileName: string) {
  const cleaned = fileName.replace(/["/\\\r\n]/g, "_").trim()
  return cleaned || "moderation-keywords.txt"
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const formData = await request.formData()
  const file = formData.get("file")

  if (!file || typeof file !== "object" || !("text" in file) || typeof file.text !== "function") {
    return NextResponse.json({ error: "Upload a .txt file." }, { status: 400 })
  }

  const uploadedFile = file as File

  if (!uploadedFile.name.toLowerCase().endsWith(".txt")) {
    return NextResponse.json({ error: "Only .txt files are accepted." }, { status: 400 })
  }

  if (uploadedFile.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File must be 8MB or smaller." }, { status: 400 })
  }

  let patterns: string[]
  try {
    patterns = parseKeywordText(await uploadedFile.text())
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : "Invalid keyword file."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (patterns.length === 0) {
    return NextResponse.json({ error: "Keyword file is empty." }, { status: 400 })
  }

  const { data, error: importError } = await supabase.rpc("admin_add_moderation_keyword_list", {
    source_file_name: uploadedFile.name,
    keyword_patterns: patterns,
  })

  if (importError) {
    return NextResponse.json({ error: importError.message }, { status: 400 })
  }

  return NextResponse.json({
    imported: typeof data?.keyword_count === "number" ? data.keyword_count : patterns.length,
    list: data,
  })
}

export async function DELETE(request: NextRequest) {
  const { supabase, error } = await getAdminSupabase()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const listId = searchParams.get("listId")

  if (!listId) {
    return NextResponse.json({ error: "Missing listId." }, { status: 400 })
  }

  const { error: deleteError } = await supabase.rpc("admin_delete_moderation_keyword_list", {
    target_list_id: listId,
  })

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  return NextResponse.json({ deleted: true })
}
