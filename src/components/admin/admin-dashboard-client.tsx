"use client"

import { useRef, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Trash2, UserX, Megaphone, Loader2, AlertTriangle, CheckCircle2, XCircle, Pin, Shield, Download, Upload } from "lucide-react"
import {
  deleteUserActivity,
  deleteUser,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
  reviewArticle,
  setArticlePinned,
  setUserRole,
} from "@/app/admin/actions"

interface AdminData {
  articles: AdminArticle[]
  pending_articles: PendingArticle[]
  events: AdminEvent[]
  documents: AdminDocument[]
  users: AdminUser[]
  tags: unknown[]
  announcements: Announcement[]
  moderation_keyword_lists?: ModerationKeywordList[]
  moderation_keyword_count?: number
  active_moderation_keyword_count?: number
  reports: unknown[]
}

interface AdminArticle {
  id: string
  title: string
  created_at: string
  is_pinned?: boolean
  author?: { display_name?: string | null } | null
}

interface PendingArticle extends AdminArticle {
  abstract?: string | null
  moderation_reason?: string | null
  moderation_score?: number | string | null
  moderation_source?: string | null
  author?: { display_name?: string | null; school?: string | null } | null
}

interface AdminEvent {
  id: string
  title: string
  organizer?: { display_name?: string | null } | null
}

interface AdminDocument {
  id: string
  title: string
  creator?: { display_name?: string | null } | null
}

interface AdminUser {
  id: string
  display_name?: string | null
  school?: string | null
  role?: "user" | "admin" | string
}

interface Announcement {
  id: string
  title: string
  content: string
  is_active: boolean
  created_at: string
}

interface ModerationKeywordList {
  id: string
  file_name: string
  keyword_count: number
  created_at: string
  created_by?: { display_name?: string | null } | null
}

export function AdminDashboardClient({ initialData }: { initialData: AdminData }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [keywordImportResult, setKeywordImportResult] = useState<string | null>(null)
  const keywordFileRef = useRef<HTMLInputElement>(null)

  // Announcement State
  const [annTitle, setAnnTitle] = useState("")
  const [annContent, setAnnContent] = useState("")

  const wrapAction = async (id: string, action: () => Promise<void>) => {
    setLoading(id)
    try {
      await action()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      alert("Error: " + message)
    }
    setLoading(null)
    setConfirmDelete(null)
  }

  const handleKeywordDownload = () => {
    window.location.href = "/api/admin/moderation-keywords"
  }

  const handleKeywordListDownload = (listId: string) => {
    window.location.href = `/api/admin/moderation-keywords?listId=${encodeURIComponent(listId)}`
  }

  const handleKeywordUpload = async () => {
    const file = keywordFileRef.current?.files?.[0]
    if (!file) {
      alert("Please choose a .txt file first.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    setLoading("upload-keywords")
    setKeywordImportResult(null)

    try {
      const response = await fetch("/api/admin/moderation-keywords", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to import keywords.")
      }

      setKeywordImportResult(`Imported ${result.imported} keywords.`)
      window.location.reload()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      alert("Error: " + message)
    } finally {
      setLoading(null)
    }
  }

  const handleKeywordListDelete = async (listId: string) => {
    setLoading(`delete-keyword-list-${listId}`)

    try {
      const response = await fetch(`/api/admin/moderation-keywords?listId=${encodeURIComponent(listId)}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete keyword file.")
      }

      window.location.reload()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error"
      alert("Error: " + message)
    } finally {
      setLoading(null)
      setConfirmDelete(null)
    }
  }

  // Confirmation wrapper - first click shows confirm, second click executes
  const handleDeleteWithConfirm = (id: string, action: () => Promise<void>) => {
    if (confirmDelete === id) {
      wrapAction(id, action)
    } else {
      setConfirmDelete(id)
      // Auto-reset after 4 seconds
      setTimeout(() => setConfirmDelete(prev => prev === id ? null : prev), 4000)
    }
  }

  return (
    <Tabs defaultValue="moderation" className="w-full">
      <TabsList className="grid grid-cols-3 w-full max-w-xl mb-8 bg-slate-100/80 p-1">
        <TabsTrigger value="moderation" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Moderation</TabsTrigger>
        <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Users</TabsTrigger>
        <TabsTrigger value="announcements" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Announcements</TabsTrigger>
      </TabsList>

      {/* ===================== MODERATION TAB ===================== */}
      <TabsContent value="moderation" className="space-y-6 focus-visible:outline-none">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="font-serif">Review Queue ({initialData.pending_articles?.length || 0})</CardTitle>
            <CardDescription>Posts held by keyword or LLM screening. Approve only content that is academic and appropriate.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {(!initialData.pending_articles || initialData.pending_articles.length === 0) && (
              <div className="p-6 text-center text-muted-foreground italic">No posts awaiting review.</div>
            )}
            <div className="divide-y divide-slate-100">
              {(initialData.pending_articles || []).map(article => (
                <div key={article.id} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{article.title}</h3>
                        <Badge variant="secondary">{article.moderation_source || "manual"}</Badge>
                        {article.moderation_score !== null && article.moderation_score !== undefined && (
                          <Badge variant="outline">score {Number(article.moderation_score).toFixed(2)}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.abstract || "No abstract."}</p>
                      <p className="text-xs text-muted-foreground">
                        {article.author?.display_name || "Unknown"} · {article.author?.school || "School not provided"} · {format(new Date(article.created_at), "MMM d, yyyy")}
                      </p>
                      {article.moderation_reason && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 inline-block">
                          {article.moderation_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => wrapAction(`approve-${article.id}`, () => reviewArticle(article.id, "approved", "Approved by admin"))}
                      >
                        {loading === `approve-${article.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => wrapAction(`reject-${article.id}`, () => reviewArticle(article.id, "rejected", "Rejected by admin"))}
                      >
                        {loading === `reject-${article.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Articles */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="font-serif">Forum Articles ({initialData.articles.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {initialData.articles.length === 0 && <div className="p-6 text-center text-muted-foreground italic">No articles.</div>}
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-100">
                  {initialData.articles.map(article => (
                    <tr key={article.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-medium text-slate-900 line-clamp-1">{article.title}</p>
                        <p className="text-xs text-muted-foreground">{article.author?.display_name || "Unknown"}</p>
                      </td>
                      <td className="p-4 text-right align-middle">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => wrapAction(`pin-art-${article.id}`, () => setArticlePinned(article.id, !article.is_pinned))}
                          className="h-8 px-2 text-slate-500 hover:text-primary"
                        >
                          {loading === `pin-art-${article.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant={confirmDelete === `del-art-${article.id}` ? "destructive" : "ghost"} 
                          size="sm" 
                          onClick={() => handleDeleteWithConfirm(`del-art-${article.id}`, () => deleteUserActivity("articles", article.id))}
                          className={confirmDelete === `del-art-${article.id}` ? "h-8 text-xs shadow-sm" : "h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"}
                        >
                          {loading === `del-art-${article.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmDelete === `del-art-${article.id}` ? "Confirm?" : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Events & Wiki */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="font-serif">Events & Wiki ({initialData.events.length + initialData.documents.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {initialData.events.length === 0 && initialData.documents.length === 0 && <div className="p-6 text-center text-muted-foreground italic">No events or wiki docs.</div>}
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-slate-100">
                  {initialData.events.map(event => (
                    <tr key={event.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px] mb-1">Event</Badge>
                        <p className="font-medium text-slate-900 line-clamp-1">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.organizer?.display_name || "Unknown"}</p>
                      </td>
                      <td className="p-4 text-right align-middle">
                        <Button 
                          variant={confirmDelete === `del-evt-${event.id}` ? "destructive" : "ghost"} 
                          size="sm" 
                          onClick={() => handleDeleteWithConfirm(`del-evt-${event.id}`, () => deleteUserActivity("events", event.id))}
                          className={confirmDelete === `del-evt-${event.id}` ? "h-8 text-xs shadow-sm" : "h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"}
                        >
                          {loading === `del-evt-${event.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmDelete === `del-evt-${event.id}` ? "Confirm?" : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {initialData.documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px] mb-1">Wiki</Badge>
                        <p className="font-medium text-slate-900 line-clamp-1">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.creator?.display_name || "Unknown"}</p>
                      </td>
                      <td className="p-4 text-right align-middle">
                        <Button 
                          variant={confirmDelete === `del-doc-${doc.id}` ? "destructive" : "ghost"} 
                          size="sm" 
                          onClick={() => handleDeleteWithConfirm(`del-doc-${doc.id}`, () => deleteUserActivity("documents", doc.id))}
                          className={confirmDelete === `del-doc-${doc.id}` ? "h-8 text-xs shadow-sm" : "h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"}
                        >
                          {loading === `del-doc-${doc.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmDelete === `del-doc-${doc.id}` ? "Confirm?" : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="font-serif">Moderation Keywords</CardTitle>
            <CardDescription>Manage first-pass rejection lists as plain text files, one keyword per line.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {initialData.active_moderation_keyword_count ?? initialData.moderation_keyword_count ?? 0} active keywords
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uploaded files are combined for screening. Blank lines and lines starting with # are ignored.
                </p>
              </div>
              <Button variant="outline" onClick={handleKeywordDownload}>
                <Download className="mr-1.5 h-4 w-4" />
                Download Merged TXT
              </Button>
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
              <Label htmlFor="keyword-file">Upload keyword file</Label>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  ref={keywordFileRef}
                  id="keyword-file"
                  type="file"
                  accept=".txt,text/plain"
                  className="bg-white"
                />
                <Button onClick={handleKeywordUpload} disabled={loading === "upload-keywords"}>
                  {loading === "upload-keywords" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
                  Upload TXT
                </Button>
              </div>
              {keywordImportResult && (
                <p className="mt-3 text-xs font-medium text-emerald-700">{keywordImportResult}</p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Keywords</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(initialData.moderation_keyword_lists || []).map((list) => (
                    <tr key={list.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{list.file_name}</p>
                        <p className="text-xs text-muted-foreground">{list.created_by?.display_name || "Unknown"}</p>
                      </td>
                      <td className="px-4 py-3">{list.keyword_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(list.created_at), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleKeywordListDownload(list.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={confirmDelete === `kw-list-${list.id}` ? "destructive" : "ghost"}
                            size="sm"
                            onClick={() => handleDeleteWithConfirm(`kw-list-${list.id}`, () => handleKeywordListDelete(list.id))}
                            className={confirmDelete === `kw-list-${list.id}` ? "h-8 text-xs shadow-sm" : "h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"}
                          >
                            {loading === `delete-keyword-list-${list.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmDelete === `kw-list-${list.id}` ? "Confirm?" : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!initialData.moderation_keyword_lists || initialData.moderation_keyword_lists.length === 0) && (
                    <tr>
                      <td className="p-6 text-center text-muted-foreground italic" colSpan={4}>No keyword files uploaded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===================== USERS TAB ===================== */}
      <TabsContent value="users" className="space-y-6 focus-visible:outline-none">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="font-serif">User Directory ({initialData.users.length})</CardTitle>
            <CardDescription>Manage platform members. Deleting a user removes their profile permanently.</CardDescription>
          </CardHeader>
          <CardContent>
            {initialData.users.length === 0 && (
              <div className="p-8 text-center text-muted-foreground italic border-2 border-dashed rounded-xl">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No users loaded. Ensure the admin SQL functions have been created.
              </div>
            )}
            {initialData.users.length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">School</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {initialData.users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{user.display_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{user.id?.substring(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4">{user.school || "—"}</td>
                        <td className="px-6 py-4">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => wrapAction(`admin-${user.id}`, () => setUserRole(user.id, "admin"))}
                              className="mr-2 h-8"
                            >
                              <Shield className="h-4 w-4 mr-1.5" />
                              Make Admin
                            </Button>
                          )}
                          {user.role !== "admin" && (
                            <Button
                              variant={confirmDelete === `del-user-${user.id}` ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleDeleteWithConfirm(`del-user-${user.id}`, () => deleteUser(user.id))}
                              className="h-8 shadow-sm"
                            >
                              {loading === `del-user-${user.id}` ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                              ) : confirmDelete === `del-user-${user.id}` ? (
                                <AlertTriangle className="h-4 w-4 mr-1.5" />
                              ) : (
                                <UserX className="h-4 w-4 mr-1.5" />
                              )}
                              {confirmDelete === `del-user-${user.id}` ? "Confirm Delete?" : "Delete"}
                            </Button>
                          )}
                          {user.role === "admin" && (
                            <span className="text-xs font-bold text-primary uppercase">Admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===================== ANNOUNCEMENTS TAB ===================== */}
      <TabsContent value="announcements" className="focus-visible:outline-none grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-200 h-fit">
          <CardHeader>
            <CardTitle className="font-serif">Publish Announcement</CardTitle>
            <CardDescription>Broadcast messages to the entire community via the Landing Page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="e.g. ISAA Winter Conference Registration Open" />
            </div>
            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea 
                value={annContent} 
                onChange={e => setAnnContent(e.target.value)} 
                className="h-32 resize-none" 
                placeholder="Details of the announcement..."
              />
            </div>
            <Button 
              className="w-full"
              onClick={() => wrapAction('add-ann', async () => {
                await createAnnouncement(annTitle, annContent)
                setAnnTitle("")
                setAnnContent("")
              })}
              disabled={!annTitle.trim() || !annContent.trim()}
            >
              {loading === 'add-ann' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
              Broadcast Now
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="font-serif text-lg">Communication History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {initialData.announcements.length === 0 && (
                <div className="p-8 text-center text-muted-foreground italic">No announcements broadcasted yet.</div>
              )}
              {initialData.announcements.map(ann => (
                <div key={ann.id} className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900">{ann.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={ann.is_active ? "default" : "secondary"}>
                        {ann.is_active ? "Active" : "Archived"}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        onClick={() => wrapAction(`tog-ann-${ann.id}`, () => toggleAnnouncement(ann.id, !ann.is_active))}
                      >
                        {loading === `tog-ann-${ann.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : ann.is_active ? "Archive" : "Activate"}
                      </Button>
                      <Button
                        variant={confirmDelete === `del-ann-${ann.id}` ? "destructive" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleDeleteWithConfirm(`del-ann-${ann.id}`, () => deleteAnnouncement(ann.id))}
                      >
                        {loading === `del-ann-${ann.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : confirmDelete === `del-ann-${ann.id}` ? "Confirm?" : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{ann.content}</p>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                    {format(new Date(ann.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
