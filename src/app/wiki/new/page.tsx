"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Save, X, Eye, Edit3, Loader2, Upload } from "lucide-react"
import dynamic from "next/dynamic"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { TagInput } from "@/components/ui/tag-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isMissingColumnError } from "@/lib/supabase-errors"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export default function NewWikiDocumentPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [subjectTags, setSubjectTags] = useState<string[]>([])
  const [schoolTags, setSchoolTags] = useState<string[]>([])
  const [allowPublicEdit, setAllowPublicEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.")
      return
    }

    setLoading(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError("You must be logged in to create a document.")
      setLoading(false)
      return
    }

    // Upload file if selected
    let fileUrl = null
    if (file) {
      setUploading(true)
      const ext = file.name.split(".").pop()
      const filePath = `${session.user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("wiki-files").upload(filePath, file)
      if (uploadError) {
        setError("File upload failed: " + uploadError.message)
        setLoading(false)
        setUploading(false)
        return
      }
      const { data: urlData } = supabase.storage.from("wiki-files").getPublicUrl(filePath)
      fileUrl = urlData.publicUrl
      setUploading(false)
    }

    const insertPayload = {
      title,
      description: description || null,
      content,
      creator_id: session.user.id,
      file_url: fileUrl,
      subject_tags: subjectTags,
      school_tags: schoolTags,
      allow_public_edit: allowPublicEdit,
    }

    let { data, error: insertError } = await supabase
      .from("documents")
      .insert(insertPayload)
      .select()
      .single()

    if (insertError && isMissingColumnError(insertError, "allow_public_edit")) {
      if (allowPublicEdit) {
        setError("Public editing needs the latest database migration. Apply supabase/migrations/20260423_fix_event_registration_and_wiki_permissions.sql first.")
        setLoading(false)
        return
      }

      const fallbackResult = await supabase
        .from("documents")
        .insert({
          title,
          description: description || null,
          content,
          creator_id: session.user.id,
          file_url: fileUrl,
          subject_tags: subjectTags,
          school_tags: schoolTags,
        })
        .select()
        .single()

      data = fallbackResult.data
      insertError = fallbackResult.error
    }

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push(`/wiki/${data.id}`)
      router.refresh()
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
          <div className="flex-1">
            <h1 className="text-4xl font-serif font-bold text-primary flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-primary/80" /> Create Academic Resource
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Initialize a shared document for the student community.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()} 
                className="rounded-xl h-11"
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={loading} 
                className="rounded-xl shadow-lg shadow-primary/20 h-11 min-w-[140px]"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Publish Document
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center">
            <X className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-6 pb-20">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="font-serif">Document Metadata</CardTitle>
                <CardDescription>Essential information for categorization.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Mathematics Study Guide - Calculus III"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-12 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Brief overview of this resource..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-20 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="font-serif">File Attachment (Optional)</CardTitle>
                <CardDescription>Upload a PDF, document, or dataset.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.pptx,.xlsx,.csv,.zip,.png,.jpg"
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {file ? file.name : "Choose File"}
                  </Button>
                  {file && <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="font-serif">Tags & Classification</CardTitle>
                <CardDescription>Categorize for discoverability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TagInput
                  label="Subject Tags"
                  placeholder="e.g., Physics, Calculus"
                  tags={subjectTags}
                  onTagsChange={setSubjectTags}
                  suggestions={["Physics", "Mathematics", "Computer Science", "Biology", "Chemistry", "Economics", "Psychology", "Philosophy", "Literature", "History"]}
                />
                <TagInput
                  label="School Tags"
                  placeholder="e.g., HFI, NCPA"
                  tags={schoolTags}
                  onTagsChange={setSchoolTags}
                  suggestions={["HFI", "NCPA", "ULC", "BSG", "AISG", "ISB", "SAS", "HKIS"]}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="font-serif">Collaboration Settings</CardTitle>
                <CardDescription>Choose whether other signed-in users can edit this wiki.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="collaboration-mode">Access Mode</Label>
                  <Select
                    value={allowPublicEdit ? "public-edit" : "view-only"}
                    onValueChange={(value) => setAllowPublicEdit(value === "public-edit")}
                  >
                    <SelectTrigger id="collaboration-mode" className="h-12">
                      <SelectValue placeholder="Select collaboration mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view-only">Public view only</SelectItem>
                      <SelectItem value="public-edit">Public edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {allowPublicEdit
                      ? "Anyone who is signed in can update this wiki."
                      : "Only you can edit this wiki after publishing."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="font-serif">Document Editor</CardTitle>
                <CardDescription>Draft your resource using Markdown syntax. Supports LaTeX ($$).</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div data-color-mode="light">
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || "")}
                    height={700}
                    previewOptions={{
                      remarkPlugins: [remarkGfm, remarkMath],
                      rehypePlugins: [rehypeKatex],
                      components: {
                        img: ({ src, ...props }) => {
                          if (!src) return null;
                          return <img src={src} {...props} />;
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
      </form>
    </div>
  )
}
