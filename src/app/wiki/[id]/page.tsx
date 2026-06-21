"use client"

import { useState, useEffect, use, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
    ChevronLeft, 
    Save, 
    Edit3, 
    Clock, 
    User as UserIcon, 
    Loader2,
    Users,
    Eye,
    Download
} from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { formatDistanceToNow } from "date-fns"
import dynamic from "next/dynamic"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { isMissingColumnError } from "@/lib/supabase-errors"
import { useToast } from "@/components/ui/toast"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface DocumentRecord {
  id: string
  creator_id: string
  title: string
  description: string | null
  content: string
  updated_at: string
  subject_tags: string[] | null
  school_tags: string[] | null
  file_url: string | null
  allow_public_edit?: boolean | null
  creator?: {
    id: string
    display_name: string
  } | null
}

export default function DocumentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const { toast } = useToast()
  const [doc, setDoc] = useState<DocumentRecord | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [allowPublicEdit, setAllowPublicEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState<{ user?: { id: string } } | null>(null)
  const isCreator = session?.user?.id === doc?.creator_id
  const isPublicEditable = Boolean(doc?.allow_public_edit)
  const canEdit = Boolean(session?.user?.id) && (isCreator || isPublicEditable)

  const fetchDocument = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("*, creator:users!creator_id(id, display_name)")
      .eq("id", params.id)
      .single()

    if (data) {
      const document = data as DocumentRecord
      setDoc(document)
      setTitle(document.title)
      setDescription(document.description || "")
      setContent(document.content)
      setAllowPublicEdit(Boolean(document.allow_public_edit))
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    void Promise.resolve().then(fetchDocument)

    const channel = supabase
      .channel(`document:${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${params.id}`,
        },
        () => {
          if (!isEditing) {
            void fetchDocument()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDocument, params.id, isEditing])

  const handleUpdate = async () => {
    if (!canEdit) {
      toast({
        variant: "error",
        title: "Permission denied",
        description: "You do not have permission to edit this document.",
      })
      return
    }
    const sessionUserId = session?.user?.id
    if (!sessionUserId) {
      toast({
        variant: "error",
        title: "Sign in required",
        description: "You must be logged in to edit this document.",
      })
      return
    }
    setSaving(true)
    const basePayload = {
      title,
      description,
      content,
      updated_at: new Date().toISOString(),
    }

    const updatePayload = isCreator
      ? { ...basePayload, allow_public_edit: allowPublicEdit }
      : basePayload

    let query = supabase
      .from("documents")
      .update(updatePayload)
      .eq("id", params.id)

    if (isCreator) {
      query = query.eq("creator_id", sessionUserId)
    } else {
      query = query.eq("allow_public_edit", true)
    }

    let { error } = await query

    if (error && isCreator && isMissingColumnError(error, "allow_public_edit")) {
      if (allowPublicEdit) {
        toast({
          variant: "warning",
          title: "Migration required",
          description: "Public editing needs the latest database migration. Apply supabase/migrations/20260423_fix_event_registration_and_wiki_permissions.sql first.",
        })
        setSaving(false)
        return
      }

      const fallbackResult = await supabase
        .from("documents")
        .update(basePayload)
        .eq("id", params.id)
        .eq("creator_id", sessionUserId)

      error = fallbackResult.error
    }

    if (!error) {
      await fetchDocument()
      setIsEditing(false)
      toast({
        variant: "success",
        title: "Document saved",
        description: "Your changes are live.",
      })
    } else {
      toast({
        variant: "error",
        title: "Failed to save",
        description: error.message,
      })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Document Not Found</h1>
        <Link href="/wiki">
          <Button variant="outline" className="rounded-xl">Return to Wiki Hub</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div className="flex items-start gap-4 flex-1">
          <Link href="/wiki" className="mt-1">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-slate-100 bg-white shadow-sm hover:bg-slate-50">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-slate-200">Wiki Document</Badge>
              {!isEditing && (
                <Badge
                  className={isPublicEditable
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 text-[10px] uppercase tracking-wider"
                    : "bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1 text-[10px] uppercase tracking-wider"}
                >
                  {isPublicEditable ? <Users className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {isPublicEditable ? "Public Edit" : "View Only"}
                </Badge>
              )}
            </div>
            
            {!isEditing ? (
              <>
                <h1 className="text-3xl font-serif font-bold text-primary leading-tight">{doc.title}</h1>
                {doc.description && (
                  <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">{doc.description}</p>
                )}
                
                {/* Render Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {(doc.subject_tags || []).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20">{tag}</Badge>
                  ))}
                  {(doc.school_tags || []).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-600">{tag}</Badge>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4 pt-2 w-full max-w-2xl">
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="h-12 text-xl font-bold font-serif shadow-sm"
                  placeholder="Document Title"
                  required
                />
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this document..."
                  className="h-20 resize-none shadow-sm"
                />
                {isCreator && (
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="space-y-1">
                      <Label htmlFor="allow-public-edit" className="text-sm font-medium text-slate-900">
                        Allow public editing
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, any signed-in user can edit this wiki.
                      </p>
                    </div>
                    <Switch
                      id="allow-public-edit"
                      checked={allowPublicEdit}
                      onCheckedChange={setAllowPublicEdit}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-end">
          {!isEditing ? (
            <>
              {canEdit && (
                <Button onClick={() => setIsEditing(true)} className="rounded-xl shadow-lg shadow-primary/10 h-11 px-6">
                  <Edit3 className="mr-2 h-4 w-4" /> {isCreator ? "Edit Wiki" : "Contribute"}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)} 
                  className="rounded-xl h-11"
              >
                Discard
              </Button>
              <Button 
                  onClick={handleUpdate} 
                  disabled={saving} 
                  className="rounded-xl shadow-lg shadow-primary/20 h-11 min-w-[140px]"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="w-full">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="font-serif">Live Document Editor</CardTitle>
              <CardDescription>Changes are synced in real-time to other readers. Supports LaTeX ($$).</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <div data-color-mode="light">
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || "")}
                    height={800}
                    previewOptions={{
                      remarkPlugins: [remarkGfm, remarkMath],
                      rehypePlugins: [rehypeKatex],
                      components: {
                        img: ({ src, ...props }) => {
                          if (!src) return null;
                          return <img src={src} alt={props.alt ?? ""} {...props} />;
                        }
                      }
                    }}
                    textareaProps={{
                      placeholder: "Start writing the documentation..."
                    }}
                    className="border-0 shadow-none rounded-b-xl"
                  />
                </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-slate-200 overflow-hidden rounded-2xl bg-white">
              <CardContent className="p-10 md:p-14">
                <div className="prose prose-slate prose-lg max-w-none prose-headings:font-serif">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      img: ({ src, ...props }) => {
                        if (!src) return null;
                        return <img src={src} alt={props.alt ?? ""} {...props} />;
                      }
                    }}
                  >
                    {doc.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-slate-200 sticky top-24 rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b py-4">
                <CardTitle className="font-serif text-xs uppercase tracking-widest text-muted-foreground">Document Info</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-primary/10 p-1.5 rounded-lg">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Primary Author</p>
                    {doc.creator?.id ? (
                      <Link href={`/profile/${doc.creator.id}`} className="hover:text-primary transition-colors">
                        <p className="font-medium text-slate-900 hover:text-primary transition-colors">{doc.creator.display_name}</p>
                      </Link>
                    ) : (
                      <p className="font-medium text-slate-900">Unknown Scholar</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg">
                    <Clock className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Last Synchronized</p>
                    <p className="font-medium text-slate-900">{formatDistanceToNow(new Date(doc.updated_at))} ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${isPublicEditable ? "bg-emerald-100" : "bg-slate-100"}`}>
                    {isPublicEditable ? <Users className="h-4 w-4 text-emerald-700" /> : <Eye className="h-4 w-4 text-slate-600" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Collaboration Mode</p>
                    <p className="font-medium text-slate-900">{isPublicEditable ? "Public Edit" : "Public View Only"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isPublicEditable
                        ? "Any signed-in user can improve this document."
                        : "Only the original author can edit this document."}
                    </p>
                  </div>
                </div>

                {doc.file_url && (
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs uppercase tracking-tighter text-muted-foreground mb-3">Attachments</h4>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full justify-start shadow-sm border-primary/20 text-primary hover:bg-primary/5">
                              <Download className="mr-2 h-4 w-4" /> Download PDF/Doc
                          </Button>
                        </a>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
