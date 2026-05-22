"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ArticleEditorForm, type ArticleFormValues } from "@/components/forum/article-editor-form"

interface ArticleEditorPageProps {
  params: Promise<{ id: string }>
}

interface ArticleRecord {
  id: string
  title: string
  abstract: string
  content: string
  subject_tags: string[] | null
  school_tags: string[] | null
  author_id: string
}

export default function EditArticlePage({ params: paramsPromise }: ArticleEditorPageProps) {
  const params = React.use(paramsPromise)
  const router = useRouter()

  const [initialValues, setInitialValues] = React.useState<ArticleFormValues>({
    title: "",
    abstract: "",
    content: "",
    subjectTags: [],
    schoolTags: [],
  })
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [accessDenied, setAccessDenied] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    const fetchArticle = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push(`/login?next=${encodeURIComponent(`/forum/${params.id}/edit`)}`)
        return
      }

      const { data } = await supabase
        .from("articles")
        .select("id, title, abstract, content, subject_tags, school_tags, author_id")
        .eq("id", params.id)
        .eq("author_id", session.user.id)
        .single()

      if (cancelled) return

      if (!data) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const article = data as ArticleRecord
      setInitialValues({
        title: article.title,
        abstract: article.abstract,
        content: article.content,
        subjectTags: article.subject_tags || [],
        schoolTags: article.school_tags || [],
      })
      setLoading(false)
    }

    void fetchArticle()

    return () => {
      cancelled = true
    }
  }, [params.id, router])

  const handleSubmit = async (values: ArticleFormValues) => {
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(`/forum/${params.id}/edit`)}`)
      return
    }

    const { error } = await supabase
      .from("articles")
      .update({
        title: values.title,
        abstract: values.abstract,
        content: values.content,
        subject_tags: values.subjectTags,
        school_tags: values.schoolTags,
      })
      .eq("id", params.id)
      .eq("author_id", session.user.id)

    if (error) {
      alert(error.message)
      setSaving(false)
      return
    }

    router.push(`/forum/${params.id}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">You can only edit articles you published.</p>
        <Link href="/profile">
          <Button variant="outline">Back to Profile</Button>
        </Link>
      </div>
    )
  }

  return (
    <ArticleEditorForm
      backHref={`/forum/${params.id}`}
      backLabel="Back to Article"
      pageTitle="Edit Article"
      pageDescription="Update your academic post and republish it instantly."
      submitLabel="Save Article"
      submitIcon="save"
      submitting={saving}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    />
  )
}
