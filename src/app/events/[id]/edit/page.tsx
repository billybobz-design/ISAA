"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { EventEditorForm, type EventFormValues } from "@/components/events/event-editor-form"

interface EditEventPageProps {
  params: Promise<{ id: string }>
}

interface EventRecord {
  id: string
  title: string
  description: string
  organizing_club_school: string
  event_date: string
  location: string
  category: string
  registration_deadline: string | null
  cover_image_url: string | null
  subject_tags: string[] | null
  school_tags: string[] | null
  organizer_id: string
}

export default function EditEventPage({ params: paramsPromise }: EditEventPageProps) {
  const params = React.use(paramsPromise)
  const router = useRouter()

  const [initialValues, setInitialValues] = React.useState<EventFormValues>({
    title: "",
    description: "",
    organizingClubSchool: "",
    eventDate: "",
    location: "",
    category: "symposium",
    registrationDeadline: "",
    coverImageUrl: "",
    subjectTags: [],
    schoolTags: [],
  })
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [accessDenied, setAccessDenied] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    const fetchEvent = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push(`/login?next=${encodeURIComponent(`/events/${params.id}/edit`)}`)
        return
      }

      const { data } = await supabase
        .from("events")
        .select("id, title, description, organizing_club_school, event_date, location, category, registration_deadline, cover_image_url, subject_tags, school_tags, organizer_id")
        .eq("id", params.id)
        .eq("organizer_id", session.user.id)
        .single()

      if (cancelled) return

      if (!data) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const event = data as EventRecord
      setInitialValues({
        title: event.title,
        description: event.description,
        organizingClubSchool: event.organizing_club_school,
        eventDate: toDateTimeLocal(event.event_date),
        location: event.location,
        category: event.category,
        registrationDeadline: toDateInputValue(event.registration_deadline),
        coverImageUrl: event.cover_image_url || "",
        subjectTags: event.subject_tags || [],
        schoolTags: event.school_tags || [],
      })
      setLoading(false)
    }

    void fetchEvent()

    return () => {
      cancelled = true
    }
  }, [params.id, router])

  const handleSubmit = async (values: EventFormValues) => {
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/events/${params.id}/edit`)}`)
      return
    }

    const { error } = await supabase
      .from("events")
      .update({
        title: values.title,
        description: values.description,
        organizing_club_school: values.organizingClubSchool,
        event_date: new Date(values.eventDate).toISOString(),
        location: values.location,
        category: values.category,
        registration_deadline: values.registrationDeadline ? new Date(values.registrationDeadline).toISOString() : null,
        cover_image_url: values.coverImageUrl || null,
        subject_tags: values.subjectTags,
        school_tags: values.schoolTags,
      })
      .eq("id", params.id)
      .eq("organizer_id", session.user.id)

    if (error) {
      alert(error.message)
      setSaving(false)
      return
    }

    router.push(`/events/${params.id}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">You can only edit events you created.</p>
        <Link href="/profile">
          <Button variant="outline">Back to Profile</Button>
        </Link>
      </div>
    )
  }

  return (
    <EventEditorForm
      backHref={`/events/${params.id}`}
      backLabel="Back to Event"
      pageTitle="Edit Event"
      pageDescription="Update the event information shown to attendees."
      submitLabel="Save Event"
      submitIcon="save"
      submitting={saving}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  )
}

function toDateInputValue(value: string | null) {
  if (!value) return ""
  return value.slice(0, 10)
}

function toDateTimeLocal(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}
