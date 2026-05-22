import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { EventsPageClient } from "@/components/events/events-page-client"
import type { EventCard } from "@/components/events/types"

export default async function EventsPage() {
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
    .from("events")
    .select(`
      *,
      organizer:users(display_name, school)
    `)
    .order("event_date", { ascending: true })

  return <EventsPageClient initialEvents={(data as EventCard[]) || []} />
}
