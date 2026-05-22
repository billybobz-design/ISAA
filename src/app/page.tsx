import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Calendar, Users, ArrowRight, Megaphone } from "lucide-react";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const metadata = {
  title: "ISAA Platform | Academic Community for International High Schoolers",
  description: "A premium academic forum and event hub for international students to collaborate, share research ideas, and discover inter-school opportunities.",
  keywords: ["academic", "research", "high school", "international schools", "collaboration", "science", "humanities"],
}

export default async function Home() {
  // Fetch latest 3 active announcements
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: announcements } = await supabase
    .rpc("fetch_active_announcements")

  const recentAnnouncements = announcements || []

  return (
    <div className="flex flex-col min-h-screen">
      {/* Announcements Banner */}
      {recentAnnouncements.length > 0 && (
        <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/10">
          <div className="container px-4 md:px-6 py-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-serif font-bold text-slate-900">Announcements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAnnouncements.map((ann: any) => (
                <div key={ann.id} className="bg-white/80 backdrop-blur-sm border border-primary/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1">{ann.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wider font-bold">
                    {new Date(ann.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 lg:py-32 bg-slate-50 border-b">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-[800px]">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground mb-4">
              Academic Collaboration Platform
            </div>
            <h1 className="text-4xl font-serif font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-primary">
              Where Research Meets Relevancy
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl font-light leading-relaxed">
              A premium space for international school students to publish research, discover academic events, and network with project partners.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/forum">
              <Button size="lg" className="h-12 px-8 text-base">
                Explore The Forum
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary text-primary hover:bg-primary/5">
                Join The Community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif font-semibold">Academic Idea Forum</h3>
              <p className="text-muted-foreground leading-relaxed">
                Publish long-form research proposals, share academic insights, and engage in peer-reviewed style discussions.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif font-semibold">Event Hub</h3>
              <p className="text-muted-foreground leading-relaxed">
                Discover inter-school academic events, from MUN conferences to STEM competitions and research symposiums.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-serif font-semibold">Student Networking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect with like-minded students across different international schools to collaborate on projects and DMs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center space-y-8">
          <h2 className="text-3xl font-serif font-bold sm:text-4xl md:text-5xl">
            Ready to contribute?
          </h2>
          <p className="mx-auto max-w-[600px] text-primary-foreground/80 text-lg">
            Join hundreds of students from top international schools sharing their academic journey today.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="h-12 px-8 text-base group">
              Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
