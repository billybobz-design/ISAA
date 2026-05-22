interface SupabaseLikeError {
  message?: string | null
  details?: string | null
  hint?: string | null
  code?: string | null
}

function getErrorText(error: SupabaseLikeError | null | undefined) {
  return [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export function isMissingColumnError(error: SupabaseLikeError | null | undefined, columnName: string) {
  const text = getErrorText(error)
  return text.includes(columnName.toLowerCase()) && text.includes("column")
}

export function isMissingTableError(error: SupabaseLikeError | null | undefined, tableName: string) {
  const text = getErrorText(error)
  return text.includes(tableName.toLowerCase()) && (text.includes("relation") || text.includes("table"))
}
