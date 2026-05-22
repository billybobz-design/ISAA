"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Search, BookOpen, Clock, User, Loader2 } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { FilterMenu } from "@/components/ui/filter-menu"

export default function WikiListingPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("documents")
      .select(`
        id,
        title,
        content,
        updated_at,
        subject_tags,
        school_tags,
        creator:users!creator_id(display_name)
      `)
      .order("updated_at", { ascending: false })
    
    if (data) setDocuments(data)
    setLoading(false)
  }

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesSubject = selectedSubjects.length === 0 || 
        selectedSubjects.some(tag => (doc.subject_tags || []).includes(tag))
        
      const matchesSchool = selectedSchools.length === 0 || 
        selectedSchools.some(tag => (doc.school_tags || []).includes(tag))

      return matchesSearch && matchesSubject && matchesSchool
    })
  }, [documents, searchQuery, selectedSubjects, selectedSchools])

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary tracking-tight flex items-center gap-3">
            <BookOpen className="h-10 w-10" /> Academic Wiki
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
            Collaborative knowledge base for student projects, research methodologies, and inter-school academic resources.
          </p>
        </div>
        <Link href="/wiki/new">
          <Button size="lg" className="shadow-lg shadow-primary/20 h-11 px-6">
            <Plus className="mr-2 h-5 w-5" /> New Document
          </Button>
        </Link>
      </div>

      {/* Global Search & Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search the knowledge base by title..." 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc: any) => (
            <Link key={doc.id} href={`/wiki/${doc.id}`} className="block h-full">
              <Card className="h-full hover:shadow-xl transition-all border-slate-200 hover:border-primary/20 group cursor-pointer overflow-hidden flex flex-col bg-white">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100/50 p-6">
                  <CardTitle className="text-xl font-serif font-bold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 italic leading-relaxed">
                    {doc.content.substring(0, 150)}...
                  </p>
                  
                  {/* Tag Display */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {(doc.subject_tags || []).slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-normal text-xs">{tag}</Badge>
                    ))}
                    {(doc.school_tags || []).slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-600 font-normal text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between text-xs text-muted-foreground mt-auto">
                  <span className="flex items-center">
                    <User className="mr-1 h-3 w-3" /> {doc.creator?.display_name || "Anonymous"}
                  </span>
                  <span className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" /> {formatDistanceToNow(new Date(doc.updated_at))} ago
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl border-slate-200 flex flex-col items-center justify-center bg-slate-50/30">
            <BookOpen className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-2xl font-serif font-bold text-slate-400">No documents found.</h2>
            <p className="text-slate-400 mt-2 max-w-sm">
              Try adjusting your search query or tag filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
