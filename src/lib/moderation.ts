export type ModerationStatus = "approved" | "pending" | "rejected"

export interface ModerationResult {
  status: ModerationStatus
  reason: string | null
  score: number | null
  source: "keyword" | "llm" | "manual"
}

function isModerationStatus(value: unknown): value is ModerationStatus {
  return value === "approved" || value === "pending" || value === "rejected"
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

  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "pending",
      reason: "LLM moderation is not configured; awaiting manual review",
      score: null,
      source: "manual",
    }
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.MODERATION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are an academic discussion platform moderation system. Review every submitted post. Return only JSON with status approved, pending, or rejected; reason; and score from 0 to 1. Reject spam, advertising, abuse, harassment, sexual content, doxxing, threats, plagiarism requests, and obvious non-academic junk. Use pending for uncertain cases, sensitive topics, low-quality but salvageable posts, or posts requiring human context. Approve legitimate academic discussion, research proposals, event recaps, questions, and peer feedback. Be fair to non-native speakers and students making genuine academic contributions.",
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
      return {
        status: "pending",
        reason: "LLM moderation unavailable; awaiting manual review",
        score: null,
        source: "manual",
      }
    }

    const data = await response.json()
    const text = data.output_text || data.output?.[0]?.content?.[0]?.text
    const parsed = JSON.parse(text) as Partial<ModerationResult>

    if (!isModerationStatus(parsed.status)) {
      return {
        status: "pending",
        reason: "LLM moderation returned an invalid status; awaiting manual review",
        score: null,
        source: "manual",
      }
    }

    return {
      status: parsed.status,
      reason: typeof parsed.reason === "string" ? parsed.reason : null,
      score: typeof parsed.score === "number" ? parsed.score : null,
      source: "llm",
    }
  } catch {
    return {
      status: "pending",
      reason: "LLM moderation failed; awaiting manual review",
      score: null,
      source: "manual",
    }
  }
}
