import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GraduationCap } from "lucide-react"
import { MyContentTabs } from "@/components/profile/my-content-tabs"
import { Metadata } from 'next'
import { ContactAuthorDialog } from "@/components/profile/contact-author-dialog"
import { createServerSupabaseClient } from "@/lib/server-supabase"

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await paramsPromise
  const supabase = await createServerSupabaseClient()
  const { data: user } = await supabase.from("users").select("display_name").eq("id", params.id).single()
  return {
    title: `${user?.display_name || 'Profile'} | ISAA Platform`,
    description: `View the academic profile of ${user?.display_name || 'a member'} on the ISAA Platform.`,
  }
}

export default async function PublicProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, school, bio, role, avatar_url, created_at, show_contact_email, contact_email")
    .eq("id", params.id)
    .single()

  if (!profile) {
    notFound()
  }

  const isEmailContactAvailable = profile.show_contact_email && profile.contact_email;

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
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-4xl font-serif bg-slate-100 text-slate-400">
                      {profile.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="text-center space-y-1 mb-6">
                  <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                    {profile.display_name}
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
                    {profile.role === "admin" ? "Platform Administrator" : "Student Researcher"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <GraduationCap className="h-4 w-4 mr-3 text-primary" />
                    <span className="font-medium">{profile.school || "No School Listed"}</span>
                  </div>
                </div>
                
                {profile.bio && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="font-serif font-medium text-slate-900 mb-2">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-6 bg-slate-50 flex flex-col gap-3">
                {isEmailContactAvailable ? (
                  <ContactAuthorDialog
                    displayName={profile.display_name}
                    contactEmail={profile.contact_email}
                  />
                ) : (
                  <div className="w-full text-center">
                    <p className="text-sm text-muted-foreground italic">
                      This user has not enabled email contact.
                    </p>
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Static Analytics */}
            <Card className="shadow-sm border-slate-200 bg-slate-50">
              <CardHeader className="p-6">
                <CardTitle className="font-serif text-lg">Platform Member</CardTitle>
                <CardDescription>Membership status</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-center">
                  <div className="text-2xl font-bold font-serif text-slate-900">
                    {new Date(profile.created_at).getFullYear()}
                  </div>
                  <div className="text-xs uppercase tracking-wider opacity-80 mt-1 text-slate-500">Joined Platform</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - User's Content */}
          <div className="lg:col-span-8">
            <MyContentTabs userId={profile.id} />
          </div>

        </div>
      </div>
    </div>
  )
}
