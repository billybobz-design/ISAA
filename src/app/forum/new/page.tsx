"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { ArticleEditorForm, type ArticleFormValues } from "@/components/forum/article-editor-form"

export default function NewArticlePage() {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (values: ArticleFormValues) => {
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("You must be logged in to publish an article.")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("articles")
      .insert({
        title: values.title,
        abstract: values.abstract,
        content: values.content,
        author_id: session.user.id,
        subject_tags: values.subjectTags,
        school_tags: values.schoolTags,
      })

    if (error) {
      alert(error.message)
    } else {
      router.push("/forum")
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
