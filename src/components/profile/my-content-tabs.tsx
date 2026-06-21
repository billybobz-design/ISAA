"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Edit, FileText, Calendar, BookOpen, ExternalLink, Users } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useToast } from "@/components/ui/toast"

interface ContentItem {
  id: string
  title: string
  created_at?: string
  event_date?: string
  updated_at?: string
  organizer_id?: string
  role?: "organizer" | "attendee"
}

interface RegisteredEventRow {
  registered_at?: string
  event?: ContentItem | ContentItem[] | null
}

export function MyContentTabs({ userId }: { userId?: string }) {
  const { session } = useAuth()
  const [articles, setArticles] = useState<ContentItem[]>([])
  const [events, setEvents] = useState<ContentItem[]>([])
  const [docs, setDocs] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const isOwner = Boolean(session?.user?.id && userId && session.user.id === userId)
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const fetchAllContent = async () => {
      setLoading(true)

      const [articlesResult, eventsResult, registeredEventsResult, docsResult] = await Promise.all([
        supabase
          .from("articles")
          .select("id, title, created_at")
          .eq("author_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("id, title, event_date, organizer_id")
          .eq("organizer_id", userId)
          .order("event_date", { ascending: true }),
        supabase
          .from("event_registrations")
          .select(`
            registered_at,
            event:events!event_id(id, title, event_date, organizer_id)
          `)
          .eq("user_id", userId)
          .eq("status", "registered"),
        supabase
          .from("documents")
          .select("id, title, updated_at")
          .eq("creator_id", userId)
          .order("updated_at", { ascending: false }),
      ])

      if (cancelled) return

      setArticles((articlesResult.data as ContentItem[]) || [])
      setDocs((docsResult.data as ContentItem[]) || [])

      const organizerEvents = (((eventsResult.data as ContentItem[]) || [])).map((event) => ({
        ...event,
        role: "organizer" as const,
      }))

      const attendeeEvents = (((registeredEventsResult.data as RegisteredEventRow[]) || [])
        .map((row) => Array.isArray(row.event) ? row.event[0] : row.event)
        .filter((event): event is ContentItem => Boolean(event))
        .map((event) => ({
          ...event,
          role: "attendee" as const,
        })))

      const mergedEvents = new Map<string, ContentItem>()

      organizerEvents.forEach((event) => {
        mergedEvents.set(event.id, event)
      })

      attendeeEvents.forEach((event) => {
        if (!mergedEvents.has(event.id)) {
          mergedEvents.set(event.id, event)
        }
      })

      const nextEvents = Array.from(mergedEvents.values()).sort((a, b) => {
        const aTime = a.event_date ? new Date(a.event_date).getTime() : 0
        const bTime = b.event_date ? new Date(b.event_date).getTime() : 0
        return aTime - bTime
      })

      setEvents(nextEvents)
        
      setLoading(false)
    }

    void fetchAllContent()

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleDelete = async (type: "article" | "event" | "document", id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return

    let tableName = ""
    const idColumn = "id"
    let authorColumn = ""

    if (type === "article") {
      tableName = "articles"
      authorColumn = "author_id"
    } else if (type === "event") {
      tableName = "events"
      authorColumn = "organizer_id"
    } else if (type === "document") {
      tableName = "documents"
      authorColumn = "creator_id"
    }

    // Strict check before deleting. Supabase RLS would naturally handle this if configured, 
    // but explicit check in API is required by the epic.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.id !== userId) {
      toast({
        variant: "error",
        title: "Unauthorized",
        description: "You can't delete this post.",
      })
      return
    }

    // Verify ownership
    const { data: verifyData } = await supabase
      .from(tableName)
      .select(authorColumn)
      .eq(idColumn, id)
      .single()

    const ownerId = verifyData?.[authorColumn as keyof typeof verifyData]
    if (!verifyData || ownerId !== session.user.id) {
      toast({
        variant: "error",
        title: "Permission denied",
        description: "You do not have permission to delete this post.",
      })
      return
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumn, id)

    if (error) {
      toast({
        variant: "error",
        title: "Failed to delete",
        description: error.message,
      })
    } else {
      // Re-fetch or locally remove from state
      if (type === "article") setArticles((prev) => prev.filter((item) => item.id !== id))
      if (type === "event") setEvents((prev) => prev.filter((item) => item.id !== id))
      if (type === "document") setDocs((prev) => prev.filter((item) => item.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    )
  }

  const renderEmptyState = (icon: React.ReactNode, title: string, desc: string) => (
    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
        {icon}
      </div>
      <h3 className="font-medium font-serif text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  )

  const renderContentList = (
    items: ContentItem[], 
    type: "article" | "event" | "document", 
    dateField: "created_at" | "event_date" | "updated_at", 
    viewPathPrefix: string,
    editPathPrefix: string
  ) => {
    if (items.length === 0) {
      return renderEmptyState(
        type === "article" ? <FileText /> : type === "event" ? <Calendar /> : <BookOpen />,
        `No ${type}s found`,
        type === "event"
          ? isOwner
            ? "You haven't created or joined any events yet."
            : "This user hasn't created or joined any events yet."
          : isOwner
            ? `You haven't created any ${type}s yet.`
            : `This user hasn't created any ${type}s yet.`
      )
    }

    const editHrefFor = (itemId: string) =>
      type === "document" ? `/${editPathPrefix}/${itemId}` : `/${editPathPrefix}/${itemId}/edit`

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl bg-white hover:border-slate-300 transition-colors gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/${viewPathPrefix}/${item.id}`} className="font-semibold text-slate-900 hover:text-primary transition-colors flex items-center gap-2 line-clamp-1">
                  {item.title}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Link>
                {type === "event" && item.role === "organizer" && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Organizer
                  </Badge>
                )}
                {type === "event" && item.role === "attendee" && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Attendee
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {item[dateField] ? format(new Date(item[dateField]), "MMM d, yyyy") : "Unknown date"}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isOwner && type === "event" && item.role === "organizer" && item.organizer_id === userId && (
                <Link href={`/${viewPathPrefix}/${item.id}#attendees`}>
                  <Button variant="outline" size="sm" className="h-8 shadow-xs">
                    <Users className="h-3 w-3 mr-1.5" /> Attendees
                  </Button>
                </Link>
              )}
              {isOwner && (type !== "event" || item.role === "organizer") && (
                <>
                  <Link href={editHrefFor(item.id)}>
                    <Button variant="outline" size="sm" className="h-8 shadow-xs">
                      <Edit className="h-3 w-3 mr-1.5" /> Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(type, item.id)}
                    className="h-8 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-none font-medium"
                  >
                    <Trash2 className="h-3 w-3 mr-1.5" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="shadow-sm border-slate-200 h-full">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <CardTitle className="font-serif">{isOwner ? "Manage Content" : "Published Content"}</CardTitle>
        <CardDescription>
          {isOwner ? "View, edit, or delete your publications" : "Browse this user's ideas, events, and wiki docs"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100/80 p-1">
            <TabsTrigger value="articles" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">My Ideas</TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">My Events</TabsTrigger>
            <TabsTrigger value="docs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Wiki Docs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="articles" className="space-y-4 focus-visible:outline-none">
            {renderContentList(articles, "article", "created_at", "forum", "forum")}
          </TabsContent>
          
          <TabsContent value="events" className="space-y-4 focus-visible:outline-none">
            {renderContentList(events, "event", "event_date", "events", "events")}
          </TabsContent>
          
          <TabsContent value="docs" className="space-y-4 focus-visible:outline-none">
            {renderContentList(docs, "document", "updated_at", "wiki", "wiki")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
