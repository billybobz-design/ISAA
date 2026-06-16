"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ArticleEditorForm, type ArticleFormValues } from "@/components/forum/article-editor-form"

export default function NewArticlePage() {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (values: ArticleFormValues) => {
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
      alert(result.error || "Unable to submit article.")
    } else {
      if (result.status === "approved") {
        router.push(`/forum/${result.id}`)
      } else if (result.status === "rejected") {
        alert(result.reason || "This article was rejected by automated moderation. An administrator can still approve it manually.")
        router.push("/forum")
      } else {
        alert("Submitted for review. An administrator will approve it before it appears publicly.")
        router.push("/forum")
      }
      router.refresh()
    }

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
      initialValues={{
        title: "",
        abstract: "",
        content: "",
        subjectTags: [],
        schoolTags: [],
      }}
      onSubmit={handleSubmit}
    />
  )
}
