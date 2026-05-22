"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronLeft, Loader2, Save, Send } from "lucide-react"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TagInput } from "@/components/ui/tag-input"
import { Textarea } from "@/components/ui/textarea"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export interface ArticleFormValues {
  title: string
  abstract: string
  content: string
  subjectTags: string[]
  schoolTags: string[]
}

interface ArticleEditorFormProps {
  backHref: string
  backLabel: string
  pageTitle: string
  pageDescription: string
  submitLabel: string
  submitIcon?: "send" | "save"
  submitting: boolean
  initialValues: ArticleFormValues
  onSubmit: (values: ArticleFormValues) => Promise<void> | void
}

const ARTICLE_SUBJECT_SUGGESTIONS = [
  "Physics",
  "Mathematics",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Economics",
  "Psychology",
  "Philosophy",
  "Literature",
  "History",
  "Art",
  "Music",
  "Environmental Science",
  "Political Science",
]

const SCHOOL_SUGGESTIONS = ["HFI", "NCPA", "ULC", "BSG", "AISG", "ISB", "SAS", "HKIS"]

export function ArticleEditorForm({
  backHref,
  backLabel,
  pageTitle,
  pageDescription,
  submitLabel,
  submitIcon = "send",
  submitting,
  initialValues,
  onSubmit,
}: ArticleEditorFormProps) {
  const [title, setTitle] = React.useState(initialValues.title)
  const [abstract, setAbstract] = React.useState(initialValues.abstract)
  const [content, setContent] = React.useState(initialValues.content)
  const [subjectTags, setSubjectTags] = React.useState<string[]>(initialValues.subjectTags)
  const [schoolTags, setSchoolTags] = React.useState<string[]>(initialValues.schoolTags)

  React.useEffect(() => {
    setTitle(initialValues.title)
    setAbstract(initialValues.abstract)
    setContent(initialValues.content)
    setSubjectTags(initialValues.subjectTags)
    setSchoolTags(initialValues.schoolTags)
  }, [initialValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      title,
      abstract,
      content,
      subjectTags,
      schoolTags,
    })
  }

  const ActionIcon = submitIcon === "save" ? Save : Send

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-7xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-3">
            <ChevronLeft className="mr-1 h-4 w-4" /> {backLabel}
          </Link>
          <h1 className="text-3xl font-serif font-bold text-primary">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2">{pageDescription}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-8 pb-20">
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="font-serif">Article Details</CardTitle>
              <CardDescription>Essential information for your academic post.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., The Impact of Micro-credentials on High School Resilience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abstract">Abstract (Executive Summary)</Label>
                <Textarea
                  id="abstract"
                  placeholder="A brief 2-3 sentence overview of your research idea or methodology."
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  required
                  className="h-24 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="font-serif">Tags & Classification</CardTitle>
              <CardDescription>Categorize your research for discoverability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TagInput
                label="Subject Tags"
                placeholder="e.g., Physics, Machine Learning, Economics"
                tags={subjectTags}
                onTagsChange={setSubjectTags}
                suggestions={ARTICLE_SUBJECT_SUGGESTIONS}
              />
              <TagInput
                label="School Tags"
                placeholder="e.g., HFI, NCPA, ULC"
                tags={schoolTags}
                onTagsChange={setSchoolTags}
                suggestions={SCHOOL_SUGGESTIONS}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl">Content Editor</CardTitle>
                  <CardDescription>Use markdown to format your research post.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || "")}
                  height={600}
                  previewOptions={{
                    remarkPlugins: [remarkGfm, remarkMath],
                    rehypePlugins: [rehypeKatex],
                    components: {
                      img: ({ src, ...props }) => {
                        if (!src) return null
                        return <img src={src} alt={props.alt ?? ""} {...props} />
                      },
                    },
                  }}
                  textareaProps={{
                    placeholder: "Write your research content here. Supports LaTeX math ($$) and Markdown...",
                  }}
                  className="border-0 shadow-none rounded-b-xl"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <Button type="submit" disabled={submitting} className="px-8 h-12 text-lg rounded-xl shadow-lg shadow-primary/20">
            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ActionIcon className="mr-2 h-5 w-5" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}
