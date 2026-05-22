"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image, { type ImageLoaderProps } from "next/image"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar, Check, ChevronLeft, ChevronRight, Copy, CornerUpLeft, History, Mail, MapPin, Users } from "lucide-react"
import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { CommentSection } from "@/components/forum/comment-section"
import { LikeButton } from "@/components/forum/like-button"
import { ShareButton } from "@/components/forum/share-button"
import { MarkdownContent } from "@/components/content/markdown-content"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ATTENDEES_PER_PAGE = 5
const remoteImageLoader = ({ src }: ImageLoaderProps) => src

interface EventUser {
  id: string
  display_name: string
  avatar_url?: string | null
  school?: string | null
  bio?: string | null
}

interface EventCount {
  count: number
}

interface EventDetailData {
  id: string
  title: string
  description: string | null
  category: string
  cover_image_url: string | null
  event_date: string
  location: string
  registration_deadline: string | null
  organizer_id: string
  organizer: EventUser
  likes_count?: EventCount[]
  comments_count?: EventCount[]
}

interface RegistrationRecord {
  id: string
  event_id: string
  user_id: string
  status: string
  registered_at: string
  note?: string | null
  attendee?: {
    id: string
    display_name: string
    avatar_url?: string | null
    school?: string | null
    show_contact_email?: boolean | null
    contact_email?: string | null
  } | null
}

export function EventDetailClient({ event }: { event: EventDetailData }) {
  const router = useRouter()
  const { profile, loading: profileLoading } = useAuth()
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([])
  const [registrationLoading, setRegistrationLoading] = useState(true)
  const [registrationActionLoading, setRegistrationActionLoading] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null)
  const [attendeePage, setAttendeePage] = useState(1)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [showPublicEmailRequiredDialog, setShowPublicEmailRequiredDialog] = useState(false)

  const registrationDeadline = event.registration_deadline ? new Date(event.registration_deadline) : null
  const isRegistrationClosed = registrationDeadline ? registrationDeadline < new Date() : false
  const initialLikes = event.likes_count?.[0]?.count || 0
  const commentsCount = event.comments_count?.[0]?.count || 0
  const isOrganizer = sessionUserId === event.organizer_id
  const organizerName = event.organizer?.display_name || "Unknown Organizer"
  const organizerSchool = event.organizer?.school || "School not provided"
  const organizerBio = event.organizer?.bio || "Academic organizers dedicated to inter-school collaboration."
  const organizerHref = event.organizer?.id ? `/profile/${event.organizer.id}` : null
  const hasPublicContactEmail = Boolean(profile?.show_contact_email && profile?.contact_email)

  const activeRegistrations = useMemo(
    () => registrations.filter((registration) => registration.status === "registered"),
    [registrations]
  )
  const totalAttendeePages = Math.max(1, Math.ceil(activeRegistrations.length / ATTENDEES_PER_PAGE))
  const currentAttendeePage = Math.min(attendeePage, totalAttendeePages)
  const paginatedRegistrations = useMemo(() => {
    const start = (currentAttendeePage - 1) * ATTENDEES_PER_PAGE
    return activeRegistrations.slice(start, start + ATTENDEES_PER_PAGE)
  }, [activeRegistrations, currentAttendeePage])

  const myActiveRegistration = activeRegistrations.find(
    (registration) => registration.user_id === sessionUserId
  )

  const isOrganizerUser = useCallback(
    (userId: string | null) => userId === event.organizer_id,
    [event.organizer_id]
  )

  const fetchRegistrations = useCallback(async (userId: string | null) => {
    setRegistrationLoading(true)
    setRegistrationMessage(null)

    if (!userId) {
      setRegistrations([])
      setRegistrationLoading(false)
      return
    }

    const query = supabase
      .from("event_registrations")
      .select(`
        id,
        event_id,
        user_id,
        status,
        registered_at,
        note,
        attendee:users!user_id(id, display_name, avatar_url, school, show_contact_email, contact_email)
      `)
      .eq("event_id", event.id)
      .order("registered_at", { ascending: true })

    if (!isOrganizerUser(userId)) {
      query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) {
      setRegistrations([])
      setRegistrationMessage(getRegistrationErrorMessage(error.message))
    } else {
      setRegistrations((data as unknown as RegistrationRecord[]) || [])
    }

    setRegistrationLoading(false)
  }, [event.id, isOrganizerUser])

  const handleCopyEmail = useCallback(async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = email
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }

    setCopiedEmail(email)
    setTimeout(() => {
      setCopiedEmail((current) => (current === email ? null : current))
    }, 2000)
  }, [])

  useEffect(() => {
    let isMounted = true
    let lastUserId: string | null = null

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return

      const userId = session?.user?.id ?? null
      if (lastUserId === userId) return
      lastUserId = userId
      setSessionUserId(userId)
      await fetchRegistrations(userId)
    }

    bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id ?? null
      if (lastUserId === userId) return
      lastUserId = userId
      setSessionUserId(userId)
      await fetchRegistrations(userId)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchRegistrations])

  const handleRegister = async () => {
    setRegistrationMessage(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/events/${event.id}`)}`)
      return
    }

    if (profileLoading) {
      setRegistrationMessage("Your profile is still loading. Please try again in a moment.")
      return
    }

    if (!hasPublicContactEmail) {
      setShowPublicEmailRequiredDialog(true)
      return
    }

    setRegistrationActionLoading(true)

    const { error } = await supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: event.id,
          user_id: session.user.id,
          status: "registered",
          registered_at: new Date().toISOString(),
        },
        { onConflict: "event_id,user_id" }
      )

    if (error) {
      setRegistrationMessage(getRegistrationErrorMessage(error.message))
    } else {
      await fetchRegistrations(session.user.id)
    }

    setRegistrationActionLoading(false)
  }

  const handleCancelRegistration = async () => {
    if (!sessionUserId) return

    setRegistrationActionLoading(true)
    setRegistrationMessage(null)

    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("event_id", event.id)
      .eq("user_id", sessionUserId)

    if (error) {
      setRegistrationMessage(getRegistrationErrorMessage(error.message))
    } else {
      await fetchRegistrations(sessionUserId)
    }

    setRegistrationActionLoading(false)
  }

  return (
    <>
      <Dialog open={showPublicEmailRequiredDialog} onOpenChange={setShowPublicEmailRequiredDialog}>
        <DialogContent className="max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-serif text-2xl text-slate-900">
              Public email required
            </DialogTitle>
            <DialogDescription className="leading-relaxed text-slate-600">
              Please add a public email in your profile before registering for this event.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPublicEmailRequiredDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowPublicEmailRequiredDialog(false)
                router.push(`/profile?highlight=public-email&returnTo=${encodeURIComponent(`/events/${event.id}`)}`)
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
        <Link href="/events" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <CornerUpLeft className="mr-2 h-4 w-4" /> Back to Event Hub
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium capitalize">
                {event.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-primary leading-tight tracking-tight">
                {event.title}
              </h1>
            </div>

          <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 border border-slate-100">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                unoptimized
                loader={remoteImageLoader}
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-center">
                <Calendar className="h-24 w-24" />
              </div>
            )}
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-primary">About the Event</h2>
            <MarkdownContent content={event.description || ""} className="text-slate-700" />
          </section>

          <section className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <h3 className="font-serif font-bold text-xl mb-6">Organizing Committee</h3>
            {organizerHref ? (
              <Link href={organizerHref}>
                <div className="flex flex-col md:flex-row gap-6 group cursor-pointer">
                  <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-serif font-bold text-2xl shrink-0 text-center group-hover:ring-2 ring-primary/20 transition-all">
                    {organizerName.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{organizerName}</h4>
                    <p className="text-sm font-medium text-primary">{organizerSchool}</p>
                    <p className="text-muted-foreground leading-relaxed italic">
                      {organizerBio}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-serif font-bold text-2xl shrink-0 text-center group-hover:ring-2 ring-primary/20 transition-all">
                  {organizerName.charAt(0)}
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-lg">{organizerName}</h4>
                  <p className="text-sm font-medium text-primary">{organizerSchool}</p>
                  <p className="text-muted-foreground leading-relaxed italic">
                    {organizerBio}
                  </p>
                </div>
              </div>
            )}
          </section>

          {isOrganizer && (
            <section id="attendees" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
              <div className="px-6 py-5 border-b bg-slate-50/70 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900">Attendee Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Review who has registered for your event.
                  </p>
                </div>
                <Badge variant="outline" className="bg-white">
                  {activeRegistrations.length} Registered
                </Badge>
              </div>

              <div className="p-6 space-y-4">
                {registrationMessage && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {registrationMessage}
                  </div>
                )}

                {registrationLoading ? (
                  <div className="text-sm text-muted-foreground">Loading attendee list...</div>
                ) : activeRegistrations.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedRegistrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {registration.attendee?.display_name || "Anonymous attendee"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {registration.attendee?.school || "School not provided"}
                          </p>
                          {registration.attendee?.show_contact_email && registration.attendee?.contact_email && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-green-700">
                              <div className="flex min-w-0 items-center gap-1.5 break-all">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="font-medium">Public Email:</span>
                                <a
                                  href={`mailto:${registration.attendee.contact_email}`}
                                  className="underline-offset-2 hover:underline"
                                >
                                  {registration.attendee.contact_email}
                                </a>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => handleCopyEmail(registration.attendee!.contact_email!)}
                              >
                                {copiedEmail === registration.attendee.contact_email ? (
                                  <>
                                    <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                    Copy Email
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          {(!registration.attendee?.show_contact_email || !registration.attendee?.contact_email) && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              No public email
                            </p>
                          )}
                        </div>
                        <div className="pt-0.5 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(registration.registered_at), "MMM d, yyyy p")}
                        </div>
                      </div>
                    ))}
                    {totalAttendeePages > 1 && (
                      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Page {currentAttendeePage} of {totalAttendeePages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentAttendeePage === 1}
                            onClick={() => setAttendeePage((page) => Math.max(1, page - 1))}
                          >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentAttendeePage === totalAttendeePages}
                            onClick={() => setAttendeePage((page) => Math.min(totalAttendeePages, page + 1))}
                          >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-muted-foreground">
                    No one has registered yet.
                  </div>
                )}
              </div>
            </section>
          )}

          <CommentSection eventId={event.id} />
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="p-3 bg-slate-50 rounded-xl mr-4 text-primary">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date & Time</p>
                    <p className="font-bold text-slate-800">{format(new Date(event.event_date), "EEEE, MMMM d")}</p>
                    <p className="text-slate-600">{format(new Date(event.event_date), "p")}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-3 bg-slate-50 rounded-xl mr-4 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Location</p>
                    <p className="font-bold text-slate-800">{event.location}</p>
                    <p className="text-slate-600 italic">Physical Attendance</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="p-3 bg-slate-50 rounded-xl mr-4 text-primary">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Registration Deadline</p>
                    <p className={cn("font-bold", isRegistrationClosed ? "text-red-500" : "text-green-600")}>
                      {registrationDeadline ? format(registrationDeadline, "MMMM d, yyyy") : "No deadline"}
                    </p>
                    <p className="text-slate-600">
                      {registrationDeadline ? (isRegistrationClosed ? "Closed" : "Open for registration") : "Registration is open until the organizer closes it."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {isOrganizer && (
                  <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                    You are the organizer of this event.
                  </p>
                )}

                {!isOrganizer && (
                  myActiveRegistration ? (
                    <Button
                      className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                      variant="outline"
                      disabled={registrationActionLoading}
                      onClick={handleCancelRegistration}
                    >
                      {registrationActionLoading ? "Updating..." : "Cancel Registration"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                      disabled={isRegistrationClosed || registrationActionLoading || profileLoading}
                      onClick={handleRegister}
                    >
                      {isRegistrationClosed
                        ? "Registration Closed"
                        : profileLoading
                          ? "Loading profile..."
                        : registrationActionLoading
                          ? "Registering..."
                          : "Register to Attend"}
                    </Button>
                  )
                )}

                <div className="flex space-x-2">
                  <LikeButton eventId={event.id} initialCount={initialLikes} />
                  <ShareButton url={`/events/${event.id}`} className="flex-1 h-10" />
                </div>

                {!isOrganizer && myActiveRegistration && (
                  <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    You are registered for this event.
                  </p>
                )}

                {registrationMessage && !isOrganizer && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {registrationMessage}
                  </p>
                )}
              </div>

              {!isOrganizer && (
                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                  By registering, you agree to follow the host school&apos;s campus visitor policy and ISAA community guidelines.
                </p>
              )}
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-slate-400 mr-3" />
                <span className="text-sm font-medium text-slate-600">{commentsCount} Comments Posted</span>
              </div>
            </div>
          </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function getRegistrationErrorMessage(message: string) {
  if (message.includes("event_registrations")) {
    return "The registration system needs the event_registrations table and policies before it can be used."
  }

  return message
}
