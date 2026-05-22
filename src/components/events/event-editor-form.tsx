"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Calendar, ChevronLeft, Image as ImageIcon, Loader2, MapPin, Save, Send } from "lucide-react"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TagInput } from "@/components/ui/tag-input"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export interface EventFormValues {
  title: string
  description: string
  organizingClubSchool: string
  eventDate: string
  location: string
  category: string
  registrationDeadline: string
  coverImageUrl: string
  subjectTags: string[]
  schoolTags: string[]
}

interface EventEditorFormProps {
  backHref: string
  backLabel: string
  pageTitle: string
  pageDescription: string
  submitLabel: string
  submitIcon?: "send" | "save"
  submitting: boolean
  initialValues: EventFormValues
  onSubmit: (values: EventFormValues) => Promise<void> | void
}

const EVENT_SUBJECT_SUGGESTIONS = [
  "Physics",
  "Mathematics",
  "Computer Science",
  "Biology",
  "Chemistry",
  "Economics",
  "Debate",
  "Model UN",
  "Business",
  "Engineering",
]

const SCHOOL_SUGGESTIONS = ["HFI", "NCPA", "ULC", "BSG", "AISG", "ISB", "SAS", "HKIS"]

export function EventEditorForm({
  backHref,
  backLabel,
  pageTitle,
  pageDescription,
  submitLabel,
  submitIcon = "send",
  submitting,
  initialValues,
  onSubmit,
}: EventEditorFormProps) {
  const [title, setTitle] = React.useState(initialValues.title)
  const [description, setDescription] = React.useState(initialValues.description)
  const [organizingClubSchool, setOrganizingClubSchool] = React.useState(initialValues.organizingClubSchool)
  const [eventDate, setEventDate] = React.useState(initialValues.eventDate)
  const [location, setLocation] = React.useState(initialValues.location)
  const [category, setCategory] = React.useState(initialValues.category)
  const [registrationDeadline, setRegistrationDeadline] = React.useState(initialValues.registrationDeadline)
  const [coverImageUrl, setCoverImageUrl] = React.useState(initialValues.coverImageUrl)
  const [subjectTags, setSubjectTags] = React.useState<string[]>(initialValues.subjectTags)
  const [schoolTags, setSchoolTags] = React.useState<string[]>(initialValues.schoolTags)

  React.useEffect(() => {
    setTitle(initialValues.title)
    setDescription(initialValues.description)
    setOrganizingClubSchool(initialValues.organizingClubSchool)
    setEventDate(initialValues.eventDate)
    setLocation(initialValues.location)
    setCategory(initialValues.category)
    setRegistrationDeadline(initialValues.registrationDeadline)
    setCoverImageUrl(initialValues.coverImageUrl)
    setSubjectTags(initialValues.subjectTags)
    setSchoolTags(initialValues.schoolTags)
  }, [initialValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      title,
      description,
      organizingClubSchool,
      eventDate,
      location,
      category,
      registrationDeadline,
      coverImageUrl,
      subjectTags,
      schoolTags,
    })
  }

  const ActionIcon = submitIcon === "save" ? Save : Send

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-4xl py-10">
      <div className="mb-8">
        <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-3">
          <ChevronLeft className="mr-1 h-4 w-4" /> {backLabel}
        </Link>
        <h1 className="text-4xl font-serif font-bold text-primary">{pageTitle}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{pageDescription}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="font-serif">General Information</CardTitle>
              <CardDescription>Basic details about the academic event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., 2024 Inter-school Physics Research Symposium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizingClubSchool">Organizing Club / School</Label>
                <Input
                  id="organizingClubSchool"
                  placeholder="e.g., HFI Physics Club / ISAA Alliance"
                  value={organizingClubSchool}
                  onChange={(e) => setOrganizingClubSchool(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="symposium">Symposium</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location / Venue</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g., HFI Main Auditorium"
                      className="pl-10"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <Label htmlFor="description" className="text-base">Event Description (Markdown)</Label>
                <div data-color-mode="light">
                  <MDEditor
                    value={description}
                    onChange={(val) => setDescription(val || "")}
                    height={400}
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
                      placeholder: "Describe the goals, agenda, and target participants... Supports LaTeX math ($$) and Markdown",
                    }}
                    className="border-slate-200 shadow-sm rounded-xl overflow-hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="font-serif">Logistics & Media</CardTitle>
              <CardDescription>Dates, deadlines, and visual representation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date & Time</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      className="pl-10"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Registration Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL (Optional)</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="coverImage"
                    placeholder="https://example.com/image.jpg"
                    className="pl-10"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="font-serif">Tags & Classification</CardTitle>
              <CardDescription>Help students discover your event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TagInput
                label="Subject Tags"
                placeholder="e.g., Physics, Debate, Model UN"
                tags={subjectTags}
                onTagsChange={setSubjectTags}
                suggestions={EVENT_SUBJECT_SUGGESTIONS}
              />
              <TagInput
                label="School Tags"
                placeholder="e.g., HFI, NCPA"
                tags={schoolTags}
                onTagsChange={setSchoolTags}
                suggestions={SCHOOL_SUGGESTIONS}
              />
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6 bg-slate-50/50">
              <Button type="submit" disabled={submitting} className="px-8 h-12 rounded-xl shadow-lg shadow-primary/20">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ActionIcon className="mr-2 h-4 w-4" />}
                {submitLabel}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
