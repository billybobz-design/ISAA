import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { EventDetailClient } from "@/components/events/event-detail-client"

export default async function EventDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      organizer:users(id, display_name, avatar_url, school, bio),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .eq("id", params.id)
    .single()

  if (!event) {
    notFound()
  }

  return <EventDetailClient event={event} />
}
