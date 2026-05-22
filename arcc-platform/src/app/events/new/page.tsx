"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { EventEditorForm, type EventFormValues } from "@/components/events/event-editor-form"

export default function NewEventPage() {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (values: EventFormValues) => {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("You must be logged in to propose an event.")
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
      alert(error.message)
    } else {
      router.push("/events")
      router.refresh()
    }

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
      initialValues={{
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
      }}
      onSubmit={handleSubmit}
    />
  )
}
