import { createServiceSupabaseClient } from "@/lib/admin-supabase"

export type ModerationStatus = "approved" | "pending" | "rejected"

export interface ModerationResult {
  status: ModerationStatus
  reason: string | null
  score: number | null
  source: "keyword" | "llm" | "manual"
}

export interface ModerationLlmSettings {
  enabled: boolean
  baseUrl: string
  apiKey: string | null
  model: string
  prompt: string
}

const DEFAULT_MODERATION_PROMPT =
  "You are an academic discussion platform moderation system. Review every submitted post. Return only JSON with status approved, pending, or rejected; reason; and score from 0 to 1. Reject spam, advertising, abuse, harassment, sexual content, doxxing, threats, plagiarism requests, and obvious non-academic junk. Use pending for uncertain cases, sensitive topics, low-quality but salvageable posts, or posts requiring human context. Approve legitimate academic discussion, research proposals, event recaps, questions, and peer feedback. Be fair to non-native speakers and students making genuine academic contributions."

function isModerationStatus(value: unknown): value is ModerationStatus {
  return value === "approved" || value === "pending" || value === "rejected"
}

export function normalizeResponsesUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "")

  if (trimmed.endsWith("/responses")) return trimmed
  if (trimmed.endsWith("/v1")) return `${trimmed}/responses`

  return `${trimmed}/v1/responses`
}

async function loadModerationLlmSettings(): Promise<ModerationLlmSettings | null> {
  const serviceSupabase = createServiceSupabaseClient()

  if (serviceSupabase) {
    const { data, error } = await serviceSupabase
      .from("platform_settings")
      .select("moderation_llm_enabled, moderation_llm_base_url, moderation_llm_api_key, moderation_llm_model, moderation_llm_prompt")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data?.moderation_llm_enabled && data.moderation_llm_api_key) {
      return {
        enabled: Boolean(data.moderation_llm_enabled),
        baseUrl: normalizeResponsesUrl(String(data.moderation_llm_base_url || "https://api.openai.com/v1/responses")),
        apiKey: String(data.moderation_llm_api_key),
        model: String(data.moderation_llm_model || "gpt-4.1-mini"),
        prompt: String(data.moderation_llm_prompt || DEFAULT_MODERATION_PROMPT),
      }
    }
  }

  if (!process.env.OPENAI_API_KEY) return null

  return {
    enabled: true,
    baseUrl: normalizeResponsesUrl(process.env.MODERATION_LLM_BASE_URL || "https://api.openai.com/v1/responses"),
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.MODERATION_MODEL || "gpt-4.1-mini",
    prompt: process.env.MODERATION_PROMPT || DEFAULT_MODERATION_PROMPT,
  }
}

export async function callModerationLlm(
  settings: ModerationLlmSettings,
  input: {
    title: string
    abstract: string
    content: string
  }
): Promise<ModerationResult> {
  const response = await fetch(settings.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: settings.model,
      input: [
        {
          role: "system",
          content: settings.prompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            title: input.title,
            abstract: input.abstract,
            content: input.content.slice(0, 8000),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "academic_moderation",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              status: { type: "string", enum: ["approved", "pending", "rejected"] },
              reason: { type: ["string", "null"] },
              score: { type: ["number", "null"], minimum: 0, maximum: 1 },
            },
            required: ["status", "reason", "score"],
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(errorText || `LLM request failed with HTTP ${response.status}`)
  }

  const data = await response.json()
  const text = data.output_text || data.output?.[0]?.content?.[0]?.text
  const parsed = JSON.parse(text) as Partial<ModerationResult>

  if (!isModerationStatus(parsed.status)) {
    throw new Error("LLM returned an invalid moderation status.")
  }

  return {
    status: parsed.status,
    reason: typeof parsed.reason === "string" ? parsed.reason : null,
    score: typeof parsed.score === "number" ? parsed.score : null,
    source: "llm",
  }
}

export async function moderateAcademicPost(input: {
  title: string
  abstract: string
  content: string
  keywordHit?: { pattern: string } | null
}): Promise<ModerationResult> {
  if (input.keywordHit) {
    return {
      status: "rejected",
      reason: `Keyword match: ${input.keywordHit.pattern}`,
      score: 1,
      source: "keyword",
    }
  }

  const llmSettings = await loadModerationLlmSettings()

  if (!llmSettings?.enabled || !llmSettings.apiKey) {
    return {
      status: "pending",
      reason: "LLM moderation is not configured; awaiting manual review",
      score: null,
      source: "manual",
    }
  }

  try {
    return await callModerationLlm(llmSettings, input)
  } catch {
    return {
      status: "pending",
      reason: "LLM moderation failed; awaiting manual review",
      score: null,
      source: "manual",
    }
  }
}
