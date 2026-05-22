"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, GraduationCap, Mail, LogOut, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { MyContentTabs } from "@/components/profile/my-content-tabs"
import { useAuth } from "@/components/auth/auth-provider"

export default function ProfilePage() {
  const { session, profile, loading, updateProfile, signOut } = useAuth()
  const router = useRouter()
  const [shouldHighlightPublicEmail, setShouldHighlightPublicEmail] = useState(false)
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const publicEmailCardClassName = useMemo(
    () => shouldHighlightPublicEmail
      ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-lg shadow-amber-100 transition-all"
      : "",
    [shouldHighlightPublicEmail]
  )

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    setShouldHighlightPublicEmail(params.get("highlight") === "public-email")
    setReturnTo(params.get("returnTo"))
  }, [])

  useEffect(() => {
    if (!shouldHighlightPublicEmail) return

    const timer = window.setTimeout(() => {
      const publicEmailSection = document.getElementById("public-email-settings")
      publicEmailSection?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 150)

    return () => window.clearTimeout(timer)
  }, [shouldHighlightPublicEmail])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || !profile) {
    router.push("/login")
    return null
  }

  return (
    <div className="bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 md:px-8 py-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - User Identity */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <div className="h-32 bg-primary/10 relative">
                {/* Decorative banner background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent mix-blend-overlay"></div>
              </div>
              <CardContent className="px-6 pb-8 pt-0 relative border-b border-slate-100">
                <div className="flex justify-center -mt-16 mb-4">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-white">
                    <AvatarImage src={profile?.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-4xl font-serif bg-slate-100 text-slate-400">
                      {profile?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="text-center space-y-1 mb-6">
                  <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                    {profile?.display_name || "Anonymous User"}
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
                    {profile?.role === "admin" ? "Platform Administrator" : "Student Researcher"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <GraduationCap className="h-4 w-4 mr-3 text-primary" />
                    <span className="font-medium">{profile?.school || "No School Listed"}</span>
                  </div>
                  <div className="flex items-center text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Mail className="h-4 w-4 mr-3 text-primary" />
                    <span className="truncate flex-1 text-slate-600">{session.user.email || "No Account Email"}</span>
                  </div>
                  <div
                    id="public-email-settings"
                    className={`rounded-xl border p-3 text-sm ${profile?.show_contact_email && profile?.contact_email ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"} ${publicEmailCardClassName}`}
                  >
                    <div className="flex items-center">
                      <Mail className={`h-4 w-4 mr-3 ${profile?.show_contact_email && profile?.contact_email ? "text-green-600" : "text-amber-600"}`} />
                      {profile?.show_contact_email && profile?.contact_email ? (
                        <span className="truncate flex-1"><span className="font-semibold">Public Contact:</span> {profile.contact_email}</span>
                      ) : (
                        <span className="flex-1">
                          <span className="font-semibold">Public Contact:</span> Not configured yet. Click <span className="font-semibold">Edit Profile</span> to add one.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {profile?.bio && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-serif font-medium text-slate-900 mb-2">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-6 bg-slate-50 flex flex-col gap-3">
                <EditProfileDialog
                  profile={profile}
                  onProfileUpdate={updateProfile}
                  autoOpenPublicEmail={shouldHighlightPublicEmail}
                  returnTo={returnTo}
                />
                {profile?.role === "admin" && (
                  <Link href="/admin" className="w-full">
                    <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Admin Dashboard
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </CardFooter>
            </Card>

            {/* Static Analytics / Stats (Placeholder for future) */}
            <Card className="shadow-sm border-slate-200 bg-primary text-primary-foreground">
              <CardHeader className="p-6">
                <CardTitle className="font-serif text-lg">Platform Engagement</CardTitle>
                <CardDescription className="text-primary-foreground/80">Your contributions to the alliance</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex justify-between">
                <div className="text-center">
                  <div className="text-3xl font-bold font-serif">A+</div>
                  <div className="text-xs uppercase tracking-wider opacity-80 mt-1">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold font-serif">Active</div>
                  <div className="text-xs uppercase tracking-wider opacity-80 mt-1">Member Since</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Post Management */}
          <div className="lg:col-span-8">
            <MyContentTabs userId={profile?.id} />
          </div>

        </div>
      </div>
    </div>
  )
}
