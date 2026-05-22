"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Trash2, UserX, Plus, Megaphone, Loader2, AlertTriangle } from "lucide-react"
import {
  deleteUserActivity,
  deleteUser,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement,
} from "@/app/admin/actions"

interface AdminData {
  articles: any[]
  events: any[]
  documents: any[]
  users: any[]
  tags: any[]
  announcements: any[]
}

export function AdminDashboardClient({ initialData }: { initialData: AdminData }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Announcement State
  const [annTitle, setAnnTitle] = useState("")
  const [annContent, setAnnContent] = useState("")

  const wrapAction = async (id: string, action: () => Promise<void>) => {
    setLoading(id)
    try {
      await action()
    } catch (e: any) {
      alert("Error: " + e.message)
    }
    setLoading(null)
    setConfirmDelete(null)
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
