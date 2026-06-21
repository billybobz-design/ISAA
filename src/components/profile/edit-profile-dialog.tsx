"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, Camera } from "lucide-react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/toast"
export function EditProfileDialog({
  profile,
  onProfileUpdate,
  autoOpenPublicEmail,
  returnTo,
}: {
  profile: any,
  onProfileUpdate: (p: any) => void,
  autoOpenPublicEmail?: boolean
  returnTo?: string | null
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || "")
  const [school, setSchool] = useState(profile?.school || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [showContactEmail, setShowContactEmail] = useState(profile?.show_contact_email || false)
  const [contactEmail, setContactEmail] = useState(profile?.contact_email || "")
  // Crop state
  const [imgSrc, setImgSrc] = useState("")
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<any>()
  const emailToggleRef = useRef<HTMLButtonElement | null>(null)
  const contactEmailInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!autoOpenPublicEmail) return
    setOpen(true)
  }, [autoOpenPublicEmail])

  useEffect(() => {
    if (!open || !autoOpenPublicEmail) return

    const timer = window.setTimeout(() => {
      if (showContactEmail) {
        contactEmailInputRef.current?.focus()
      } else {
        emailToggleRef.current?.focus()
      }
    }, 150)

    return () => window.clearTimeout(timer)
  }, [open, autoOpenPublicEmail, showContactEmail])

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined)
      const reader = new FileReader()
      reader.addEventListener("load", () => setImgSrc(reader.result?.toString() || ""))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    )
    setCrop(crop)
  }

  const getCroppedImg = async (image: HTMLImageElement, crop: any): Promise<Blob | null> => {
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext("2d")

    if (!ctx) return null

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, "image/jpeg", 0.95)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let avatarUrl = profile?.avatar_url

    // Handle avatar upload if new image selected
    if (imgSrc && imgRef.current && completedCrop?.width && completedCrop?.height) {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)
      if (croppedBlob) {
        const filePath = `${session.user.id}-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from("avatar-files")
          .upload(filePath, croppedBlob, {
            contentType: "image/jpeg",
            upsert: true
          })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("avatar-files")
            .getPublicUrl(filePath)
          avatarUrl = publicUrl
        } else {
          console.error("Upload error:", uploadError)
          toast({
            variant: "error",
            title: "Avatar upload failed",
            description: uploadError.message,
          })
        }
      }
    }

    const updates = {
      display_name: displayName,
      school: school,
      bio: bio,
      avatar_url: avatarUrl,
      show_contact_email: showContactEmail,
      contact_email: contactEmail,
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id)

    if (error) {
      toast({
        variant: "error",
        title: "Failed to save profile",
        description: error.message,
      })
    } else {
      onProfileUpdate({ ...profile, ...updates })
      setOpen(false)
      if (autoOpenPublicEmail && returnTo) {
        router.push(returnTo)
      }
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full">Edit Profile</Button>} />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex flex-col items-center space-y-4">
            <Label htmlFor="avatar-upload" className="cursor-pointer group relative">
              <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-sm relative overflow-hidden group-hover:opacity-80 transition-opacity">
                <AvatarImage src={imgSrc || profile?.avatar_url} />
                <AvatarFallback className="text-2xl font-serif bg-slate-100 text-slate-400">
                  {displayName?.charAt(0) || "U"}
                </AvatarFallback>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </Avatar>
            </Label>
            <Input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={onSelectFile} 
            />
            {imgSrc && (
              <div className="w-full mt-4 flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
             <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
             >
               <img
                 ref={imgRef}
                 alt="Crop me"
                 src={imgSrc}
                 onLoad={onImageLoad}
                 className="max-h-[200px] w-auto"
               />
             </ReactCrop>
             </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>School</Label>
            <Input value={school} onChange={(e) => setSchool(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Tell us about your academic journey..."
              className="resize-none h-24"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Email Contact</Label>
                <p className="text-xs text-muted-foreground">Let other users contact you via email</p>
              </div>
              <Switch checked={showContactEmail} onCheckedChange={setShowContactEmail} ref={emailToggleRef} />
            </div>
            {showContactEmail && (
              <div className="space-y-2">
                <Label>Contact Email Address</Label>
                <Input
                  ref={contactEmailInputRef}
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
