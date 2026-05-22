"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { FilterMenu } from "@/components/ui/filter-menu"
import type { EventCard } from "@/components/events/types"

export function EventsPageClient({ initialEvents }: { initialEvents: EventCard[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])

  const filteredEvents = useMemo(() => {
    return initialEvents.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject =
        selectedSubjects.length === 0 ||
        selectedSubjects.some((tag) => (event.subject_tags || []).includes(tag))
      const matchesSchool =
        selectedSchools.length === 0 ||
        selectedSchools.some((tag) => (event.school_tags || []).includes(tag))

      return matchesSearch && matchesSubject && matchesSchool
    })
  }, [initialEvents, searchQuery, selectedSubjects, selectedSchools])

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold text-primary">Event Hub</h1>
            <p className="text-muted-foreground text-lg">Discover and participate in inter-school academic symposiums, conferences, and competitions.</p>
          </div>
          <Link href="/events/new">
            <Button className="h-11 px-6 shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Propose Event
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search events by title..."
              className="pl-11 h-11 bg-white border-slate-200 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <FilterMenu
            selectedSubjects={selectedSubjects}
            setSelectedSubjects={setSelectedSubjects}
            selectedSchools={selectedSchools}
            setSelectedSchools={setSelectedSchools}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const organizerSchool = event.organizer?.school || "Organizer unavailable"

              return (
                <Card key={event.id} className="group hover:shadow-lg transition-all border-slate-200 overflow-hidden flex flex-col bg-white">
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    {event.cover_image_url ? (
                      <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Calendar className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-sm border-none shadow-sm capitalize font-medium">
                        {event.category || "Event"}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="space-y-1">
                    <div className="flex items-center text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                      <span>{format(new Date(event.event_date), "EEE, MMM d • h:mm a")}</span>
                    </div>
                    <Link href={`/events/${event.id}`}>
                      <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors leading-snug h-14 line-clamp-2">
                        {event.title}
                      </CardTitle>
                    </Link>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location || "Location TBD"}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Users className="mr-2 h-4 w-4 text-slate-400 shrink-0" />
                        <span>Hosted by <span className="font-medium text-slate-900">{organizerSchool}</span></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50">
                      {(event.subject_tags || []).slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-normal text-xs">{tag}</Badge>
                      ))}
                      {(event.school_tags || []).slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-600 font-normal text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="border-t bg-slate-50/50 flex items-center justify-between py-4 mt-auto">
                    <span className="text-xs font-medium text-slate-500">
                      Closes: {event.registration_deadline ? format(new Date(event.registration_deadline), "MMM d") : "TBD"}
                    </span>
                    <Link href={`/events/${event.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 p-0 h-auto font-medium">
                        Details &rarr;
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl border-slate-200">
              <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-medium text-slate-400">No events found.</h2>
              <p className="text-slate-400 mt-1">Try adjusting your search or tag filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
