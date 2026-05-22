"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PenTool, ThumbsUp, MessageSquare, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { FilterMenu } from "@/components/ui/filter-menu"
import type { ForumArticleCard } from "@/components/forum/types"

export function ForumPageClient({ initialArticles }: { initialArticles: ForumArticleCard[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject =
        selectedSubjects.length === 0 ||
        selectedSubjects.some((tag) => (article.subject_tags || []).includes(tag))
      const matchesSchool =
        selectedSchools.length === 0 ||
        selectedSchools.some((tag) => (article.school_tags || []).includes(tag))

      return matchesSearch && matchesSubject && matchesSchool
    })
  }, [initialArticles, searchQuery, selectedSubjects, selectedSchools])

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold text-primary">Academic Idea Forum</h1>
            <p className="text-muted-foreground text-lg">Share your research proposals and academic findings with the community.</p>
          </div>
          <Link href="/forum/new">
            <Button className="h-11 px-6 shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Publish New Idea
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search research titles..."
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-6">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => {
                const authorName = article.author?.display_name || "Unknown Author"
                const authorSchool = article.author?.school || "School not provided"
                const authorHref = article.author?.id ? `/profile/${article.author.id}` : null

                return (
                  <Card key={article.id} className="group hover:shadow-md transition-shadow border-slate-200 bg-white">
                    <header className="px-6 pt-6 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={cn(
                            "flex items-center space-x-2 text-sm text-muted-foreground",
                            authorHref && "group/author cursor-pointer"
                          )}
                          onClick={(e) => {
                            if (!authorHref) return
                            e.preventDefault()
                            window.location.href = authorHref
                          }}
                        >
                          <div className="flex -space-x-1">
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold group-hover/author:ring-1 ring-primary/50">
                              {authorName.charAt(0)}
                            </div>
                          </div>
                          <span className="font-medium text-foreground group-hover/author:text-primary transition-colors">{authorName}</span>
                          <span>•</span>
                          <span>{authorSchool}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(article.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <Link href={`/forum/${article.id}`}>
                        <CardTitle className="text-2xl font-serif group-hover:text-primary transition-colors leading-tight">
                          {article.title}
                        </CardTitle>
                      </Link>
                    </header>
                    <CardContent className="px-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {article.abstract || "No abstract provided."}
                      </p>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-sm">{article.likes_count[0]?.count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm">{article.comments_count[0]?.count || 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {(article.subject_tags || []).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-normal text-xs">{tag}</Badge>
                        ))}
                        {(article.school_tags || []).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-600 font-normal text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </CardFooter>
                  </Card>
                )
              })
            ) : (
              <div className="py-20 text-center border-2 border-dashed rounded-xl border-slate-200">
                <PenTool className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-medium text-slate-400">No articles found.</h2>
                <p className="text-slate-400 mt-1">Try adjusting your search or tag filters.</p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1 space-y-8">
            <section className="space-y-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-serif font-bold text-lg">ISAA Community Guidelines</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ensure your posts are academic in nature, cite sources where appropriate, and maintain a respectful tone for peer review.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
