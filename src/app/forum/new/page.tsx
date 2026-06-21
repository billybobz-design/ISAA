"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ArticleEditorForm, type ArticleFormValues } from "@/components/forum/article-editor-form"
import { useToast } from "@/components/ui/toast"

export default function NewArticlePage() {
  const [loading, setLoading] = React.useState(false)
  const [draft, setDraft] = React.useState<ArticleFormValues>({
    title: "",
    abstract: "",
    content: "",
    subjectTags: [],
    schoolTags: [],
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (values: ArticleFormValues) => {
    setDraft(values)
    setLoading(true)

    const response = await fetch("/api/articles/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "error",
        title: "Unable to submit article",
        description: result.error || "Please review the article and try again.",
      })
      setLoading(false)
      return
    }

    if (result.status === "approved") {
      toast({
        variant: "success",
        title: "Article published",
        description: "Your article is live on the forum.",
      })
      router.push(`/forum/${result.id}`)
    } else {
      toast({
        variant: "info",
        title: "Submitted for review",
        description: "Your article is pending. An administrator will review it before it appears publicly.",
      })
      router.push("/forum")
    }
    router.refresh()

    setLoading(false)
  }

  return (
    <ArticleEditorForm
      backHref="/forum"
      backLabel="Back to Forum"
      pageTitle="Publish New Idea"
      pageDescription="Share your academic proposal with the community."
      submitLabel="Publish to Forum"
      submitIcon="send"
      submitting={loading}
      initialValues={draft}
      onSubmit={handleSubmit}
    />
  )
}
