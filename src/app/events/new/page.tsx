"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { EventEditorForm, type EventFormValues } from "@/components/events/event-editor-form"
import { useToast } from "@/components/ui/toast"

export default function NewEventPage() {
  const [loading, setLoading] = React.useState(false)
  const [draft, setDraft] = React.useState<EventFormValues>({
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
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (values: EventFormValues) => {
    setDraft(values)
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast({
        variant: "error",
        title: "Sign in required",
        description: "You must be logged in to propose an event.",
      })
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("events")
      .insert({
        title: values.title,
        description: values.description,
        organizing_club_school: values.organizingClubSchool,
        event_date: values.eventDate ? new Date(values.eventDate).toISOString() : new Date().toISOString(),
        location: values.location,
        category: values.category,
        registration_deadline: values.registrationDeadline ? new Date(values.registrationDeadline).toISOString() : null,
        cover_image_url: values.coverImageUrl || null,
        organizer_id: session.user.id,
        subject_tags: values.subjectTags,
        school_tags: values.schoolTags,
      })

    if (error) {
      toast({
        variant: "error",
        title: "Unable to create event",
        description: error.message,
      })
      setLoading(false)
      return
    }

    toast({
      variant: "success",
      title: "Event proposed",
      description: "Your event has been added to the hub.",
    })
    router.push("/events")
    router.refresh()
    setLoading(false)
  }

  return (
    <EventEditorForm
      backHref="/events"
      backLabel="Back to Event Hub"
      pageTitle="Propose New Event"
      pageDescription="Organize an academic symposium, competition, or workshop."
      submitLabel="Propose Event"
      submitIcon="send"
      submitting={loading}
      initialValues={draft}
      onSubmit={handleSubmit}
    />
  )
}
